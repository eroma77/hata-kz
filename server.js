const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to log requests (useful for debugging Render/OAuth)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Dynamic injector for config.js to supply environment variables to the browser
app.get('/config.js', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'config.js');
        let configContent = fs.readFileSync(filePath, 'utf8');

        // Dynamically replace values with environment variables if set on the server
        if (process.env.SUPABASE_URL) {
            console.log("Injecting SUPABASE_URL from environment...");
            configContent = configContent.replace(
                /supabaseUrl:\s*["'][^"']*["']/g,
                `supabaseUrl: "${process.env.SUPABASE_URL}"`
            );
        }
        if (process.env.SUPABASE_ANON_KEY) {
            console.log("Injecting SUPABASE_ANON_KEY from environment...");
            configContent = configContent.replace(
                /supabaseAnonKey:\s*["'][^"']*["']/g,
                `supabaseAnonKey: "${process.env.SUPABASE_ANON_KEY}"`
            );
        }
        if (process.env.SUPABASE_REDIRECT_URL) {
            console.log("Injecting SUPABASE_REDIRECT_URL from environment...");
            configContent = configContent.replace(
                /supabaseRedirectUrl:\s*["'][^"']*["']/g,
                `supabaseRedirectUrl: "${process.env.SUPABASE_REDIRECT_URL}"`
            );
        }

        res.setHeader('Content-Type', 'application/javascript');
        res.send(configContent);
    } catch (err) {
        console.error("Error serving dynamic config.js:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Serve static files from root directory
app.use(express.static(__dirname));

// Fallback to index.html for Single Page Application routing (just in case)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Hata.kz Server is running on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(`===============================================`);
});
