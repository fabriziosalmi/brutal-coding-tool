
interface GitHubRepoData {
    fileTree: string;
    readme: string;
    commits: string;
    criticalFiles: string;
    sourceSamples: string;
}

export const formatContext = (data: GitHubRepoData): string => {
    return `
    REPO CONTEXT:

    [README]
    ${data.readme}

    [COMMITS (Latest 20)]
    ${data.commits}

    [FILE TREE]
    ${data.fileTree}

    [CRITICAL CONFIG FILES]
    ${data.criticalFiles}

    [ACTUAL SOURCE CODE SAMPLES (FOR INTELLIGENCE CHECK)]
    ${data.sourceSamples}
    `;
};

export const fetchGitHubRepoData = async (repoUrl: string, token?: string): Promise<GitHubRepoData> => {
    // 1. Parse URL
    // Handle trailing slashes and extract owner/repo
    const cleanUrl = repoUrl.trim().replace(/\/$/, '');
    // Regex now handles standard github.com URLs more robustly
    const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/?#]+)/);
    
    if (!match) {
        throw new Error("Invalid GitHub URL. Format: https://github.com/owner/repo");
    }
    const [, owner, repo] = match;
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
    
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
    };
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    const fetchData = async (url: string) => {
        const res = await fetch(url, { headers });
        if (!res.ok) {
            if (res.status === 403) throw new Error("GitHub API Rate Limit Exceeded. Please provide a Token.");
            if (res.status === 404) throw new Error("Repository not found or private.");
            throw new Error(`GitHub API Error: ${res.statusText}`);
        }
        return res.json();
    };

    try {
        // 2. Fetch README
        let readme = "";
        try {
            const readmeData = await fetchData(`${baseUrl}/readme`);
            readme = atob(readmeData.content);
        } catch (e) {
            readme = "[No README found]";
        }

        // 3. Fetch Commits (simulate git log)
        // Fetched 20 to analyze patterns better
        let commits = "";
        try {
            const commitsData = await fetchData(`${baseUrl}/commits?per_page=20`);
            commits = commitsData.map((c: any) => {
                const msg = c.commit.message.split('\n')[0]; // First line only
                const date = c.commit.author.date.split('T')[0];
                const author = c.commit.author.name;
                const sha = c.sha.substring(0, 7);
                // Check if verified (proxy for quality sometimes)
                const verified = c.commit.verification?.verified ? " [Verified]" : "";
                return `${sha} ${date} [${author}]${verified}: ${msg}`;
            }).join('\n');
        } catch (e) {
            commits = "[Could not fetch commits]";
        }

        // 4. Fetch File Tree (Recursive)
        let fileTree = "";
        let criticalFiles = "";
        let sourceSamples = "";
        
        try {
            const repoData = await fetchData(baseUrl);
            const defaultBranch = repoData.default_branch;
            const treeData = await fetchData(`${baseUrl}/git/trees/${defaultBranch}?recursive=1`);
            
            const allFiles = treeData.tree.filter((f: any) => f.type === 'blob');
            
            // Limit tree size for LLM context
            const filePaths = allFiles.map((f: any) => f.path);
            fileTree = filePaths.slice(0, 300).join('\n');
            if (filePaths.length > 300) fileTree += `\n... (${filePaths.length - 300} more files)`;

            // 5. Fetch Content of Critical Files (Manifests)
            const criticalPatterns = ['package.json', 'Cargo.toml', 'go.mod', 'requirements.txt', 'pom.xml', 'docker-compose.yml', 'Dockerfile', 'Makefile'];
            const foundCritical = filePaths.filter((f: string) => criticalPatterns.includes(f.split('/').pop() || ''));

            for (const path of foundCritical.slice(0, 3)) { 
                try {
                    const contentData = await fetchData(`${baseUrl}/contents/${path}`);
                    const content = atob(contentData.content);
                    criticalFiles += `\n--- ${path} ---\n${content}\n`;
                } catch (e) {
                    // Ignore download errors
                }
            }

            // 6. Source Code Intelligence Sampling
            // Find "meaty" source files (not too small, not too huge) to judge coding intelligence
            const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.rs', '.go', '.py', '.rb', '.java', '.cpp', '.c', '.h', '.swift', '.kt', '.php'];
            const potentialSources = allFiles.filter((f: any) => {
                const ext = '.' + f.path.split('.').pop();
                // Filter by extension and size (1KB - 50KB) to avoid minified files or empty files
                return sourceExtensions.includes(ext) && f.size > 1000 && f.size < 50000;
            });

            // Sort by size descending to get complex files, take top 2
            potentialSources.sort((a: any, b: any) => b.size - a.size);
            const selectedSources = potentialSources.slice(0, 2);

            for (const file of selectedSources) {
                try {
                    const contentData = await fetchData(`${baseUrl}/contents/${file.path}`);
                    const content = atob(contentData.content);
                    // Truncate if too long (max 200 lines)
                    const lines = content.split('\n').slice(0, 200).join('\n');
                    sourceSamples += `\n--- SOURCE SAMPLE: ${file.path} ---\n${lines}\n...(truncated)\n`;
                } catch (e) {
                    // Ignore
                }
            }

        } catch (e) {
            fileTree = "[Could not fetch file tree]";
        }

        return {
            readme,
            commits,
            fileTree,
            criticalFiles,
            sourceSamples
        };

    } catch (error) {
        console.error("GitHub Fetch Error", error);
        throw error;
    }
};
