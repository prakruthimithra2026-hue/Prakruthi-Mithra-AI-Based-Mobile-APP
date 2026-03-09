import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables from .env file if it exists
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes can go here if needed
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        
        // Inject environment variables into the client safely
        const env = {
          NODE_ENV: process.env.NODE_ENV || 'development',
          GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || '',
          API_KEY: process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_API_KEY || '',
        };
        
        const script = `<script>
          window.process = window.process || { env: {} };
          window.process.env = window.process.env || {};
          Object.assign(window.process.env, ${JSON.stringify(env)});
          window.ENV = window.process.env;
        </script>`;
        template = template.replace("</head>", `${script}</head>`);
        
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      let template = fs.readFileSync(path.resolve(__dirname, "dist/index.html"), "utf-8");
      
      // Inject environment variables into the client safely
      const env = {
        NODE_ENV: process.env.NODE_ENV || 'production',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || '',
        API_KEY: process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_API_KEY || '',
      };
      
      const script = `<script>
        window.process = window.process || { env: {} };
        window.process.env = window.process.env || {};
        Object.assign(window.process.env, ${JSON.stringify(env)});
        window.ENV = window.process.env;
      </script>`;
      template = template.replace("</head>", `${script}</head>`);
      
      res.send(template);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
