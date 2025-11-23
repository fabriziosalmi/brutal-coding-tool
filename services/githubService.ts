
interface GitHubRepoData {
    fileTree: string;
    readme: string;
    commits: string;
    criticalFiles: string;
}

export const fetchGitHubRepoData = async (repoUrl: string, token?: string): Promise<GitHubRepoData> => {
    // 1. Parse URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
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
        let commits = "";
        try {
            const commitsData = await fetchData(`${baseUrl}/commits?per_page=15`);
            commits = commitsData.map((c: any) => {
                const msg = c.commit.message.split('\n')[0]; // First line only
                const date = c.commit.author.date;
                const author = c.commit.author.name;
                const sha = c.sha.substring(0, 7);
                return `${sha} ${date} [${author}] ${msg}`;
            }).join('\n');
        } catch (e) {
            commits = "[Could not fetch commits]";
        }

        // 4. Fetch File Tree (Recursive to depth 2 roughly, or just root)
        // Using the Git Data API to get a tree is more efficient than contents
        // First get default branch ref
        let fileTree = "";
        let criticalFiles = "";
        
        try {
            const repoData = await fetchData(baseUrl);
            const defaultBranch = repoData.default_branch;
            const treeData = await fetchData(`${baseUrl}/git/trees/${defaultBranch}?recursive=1`);
            
            // Limit tree size for LLM context
            const files = treeData.tree
                .filter((f: any) => f.type === 'blob')
                .map((f: any) => f.path);
            
            fileTree = files.slice(0, 300).join('\n');
            if (files.length > 300) fileTree += `\n... (${files.length - 300} more files)`;

            // 5. Fetch Content of Critical Files (Manifests)
            // Heuristic for "Critical Files"
            const criticalPatterns = ['package.json', 'Cargo.toml', 'go.mod', 'requirements.txt', 'pom.xml', 'docker-compose.yml', 'Dockerfile'];
            const foundCritical = files.filter((f: string) => criticalPatterns.includes(f.split('/').pop() || ''));

            for (const path of foundCritical.slice(0, 3)) { // Limit to 3 manifests
                try {
                    const contentData = await fetchData(`${baseUrl}/contents/${path}`);
                    const content = atob(contentData.content);
                    criticalFiles += `\n--- ${path} ---\n${content}\n`;
                } catch (e) {
                    // Ignore download errors for individual files
                }
            }

        } catch (e) {
            fileTree = "[Could not fetch file tree]";
        }

        return {
            readme,
            commits,
            fileTree,
            criticalFiles
        };

    } catch (error) {
        console.error("GitHub Fetch Error", error);
        throw error;
    }
};

export const formatContext = (data: GitHubRepoData): string => {
    return `
=== REPOSITORY FILE TREE ===
${data.fileTree}

=== RECENT COMMIT HISTORY (git log --oneline) ===
${data.commits}

=== CRITICAL DEPENDENCY FILES ===
${data.criticalFiles}

=== README.md ===
${data.readme}
    `.trim();
};
