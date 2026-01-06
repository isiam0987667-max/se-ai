import express from 'express';
import cors from 'cors';
import { Octokit } from "octokit";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// GitHub repo details
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // AI repo env variable
const MAIN_REPO_OWNER = "isiam0987667-max"; 
const MAIN_REPO_NAME = "se"; 
const FILE_PATH = "index.html";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

app.post('/add-link', async (req,res) => {
    const { url } = req.body;
    if(!url) return res.json({message:"URL required"});

    try {
        const { data } = await octokit.rest.repos.getContent({
            owner: MAIN_REPO_OWNER,
            repo: MAIN_REPO_NAME,
            path: FILE_PATH
        });

        const content = Buffer.from(data.content,'base64').toString('utf-8');

        const title = url.split('/').pop().split(/[?#]/)[0];
        const newObj = `{url:"${url}", title:"${title}"}`;

        const updatedContent = content.replace(/(let videos = \[)([\s\S]*?)(\];)/, (match,p1,p2,p3)=>{
            const newArray = p2.trim() ? p2.trim() + ",\n  " + newObj : "\n  " + newObj;
            return p1 + "\n  " + newArray + "\n" + p3;
        });

        await octokit.rest.repos.createOrUpdateFileContents({
            owner: MAIN_REPO_OWNER,
            repo: MAIN_REPO_NAME,
            path: FILE_PATH,
            message: `Added new video link: ${title}`,
            content: Buffer.from(updatedContent).toString('base64'),
            sha: data.sha
        });

        res.json({message:"URL added successfully!"});

    } catch(err){
        console.error(err);
        res.json({message:"Error adding URL"});
    }
});

app.listen(PORT, ()=>console.log(`AI server running on port ${PORT}`));
