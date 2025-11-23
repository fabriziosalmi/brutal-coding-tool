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
    const cleanUrl = repoUrl.trim().replace(/\/+$/, '');
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
            // Don't throw for 404 on specific files, handle in caller, but throw for repo root
            return null; 
        }
        return res.json();
    };

    console.log("[GitHub] Starting parallel fetch...");

    try {
        // PARALLEL STEP 1: Fetch Meta, Readme, Commits simultaneously
        const [repoData, readmeData, commitsData] = await Promise.all([
            fetch(baseUrl, { headers }).then(r => r.ok ? r.json() : Promise.reject(new Error(`Repo fetch failed: ${r.status}`))),
            fetch(`${baseUrl}/readme`, { headers }).then(r => r.ok ? r.json() : null),
            fetch(`${baseUrl}/commits?per_page=20`, { headers }).then(r => r.ok ? r.json() : null)
        ]);

        const defaultBranch = repoData.default_branch;
        
        // Process Readme
        const readme = readmeData ? atob(readmeData.content) : "[No README found]";

        // Process Commits
        let commits = "[Could not fetch commits]";
        if (commitsData && Array.isArray(commitsData)) {
            commits = commitsData.map((c: any) => {
                const msg = c.commit.message.split('\n')[0];
                const date = c.commit.author.date.split('T')[0];
                const author = c.commit.author.name;
                const sha = c.sha.substring(0, 7);
                const verified = c.commit.verification?.verified ? " [Verified]" : "";
                return `${sha} ${date} [${author}]${verified}: ${msg}`;
            }).join('\n');
        }

        // STEP 2: Fetch File Tree
        let fileTree = "";
        let criticalFiles = "";
        let sourceSamples = "";
        let allFiles: any[] = [];

        try {
            const treeUrl = `${baseUrl}/git/trees/${defaultBranch}?recursive=1`;
            const treeData = await fetchData(treeUrl);
            
            if (treeData && treeData.tree) {
                allFiles = treeData.tree.filter((f: any) => f.type === 'blob');
                const filePaths = allFiles.map((f: any) => f.path);
                fileTree = filePaths.slice(0, 300).join('\n');
                if (filePaths.length > 300) fileTree += `\n... (${filePaths.length - 300} more files)`;
            } else {
                fileTree = "[Tree fetch failed]";
            }
        } catch (e) {
            fileTree = "[Could not fetch file tree]";
        }

        // PARALLEL STEP 3: Fetch Content (Critical Files + Source Samples)
        // Only run this if we successfully got the file list
        if (allFiles.length > 0) {
            const criticalPatterns = ['package.json', 'Cargo.toml', 'go.mod', 'requirements.txt', 'pom.xml', 'docker-compose.yml', 'Dockerfile', 'Makefile'];
            const foundCritical = allFiles.filter((f: any) => criticalPatterns.includes(f.path.split('/').pop() || '')).slice(0, 3);
            
            const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.rs', '.go', '.py', '.rb', '.java', '.cpp', '.c', '.h', '.swift', '.kt', '.php'];
            const potentialSources = allFiles.filter((f: any) => {
                const ext = '.' + f.path.split('.').pop();
                return sourceExtensions.includes(ext) && f.size > 1000 && f.size < 50000;
            }).sort((a: any, b: any) => b.size - a.size).slice(0, 2);

            // Fetch all selected files in parallel
            const filesToFetch = [...foundCritical, ...potentialSources];
            const contentResults = await Promise.all(
                filesToFetch.map(f => fetch(`${baseUrl}/contents/${f.path}`, { headers }).then(r => r.ok ? r.json() : null))
            );

            // Separate and Format
            // critical files correspond to indices 0 to foundCritical.length - 1
            const criticalResults = contentResults.slice(0, foundCritical.length);
            const sourceResults = contentResults.slice(foundCritical.length);

            criticalFiles = criticalResults.map((d, i) => {
                if (!d) return "";
                return `\n--- ${foundCritical[i].path} ---\n${atob(d.content)}\n`;
            }).join('');

            sourceSamples = sourceResults.map((d, i) => {
                if (!d) return "";
                const content = atob(d.content);
                const lines = content.split('\n').slice(0, 200).join('\n');
                return `\n--- SOURCE SAMPLE: ${potentialSources[i].path} ---\n${lines}\n...(truncated)\n`;
            }).join('');
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