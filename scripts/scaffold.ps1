#Generate boilerplate for the remaining seven projects.
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

$projects = @(
    @{ dir = '02-inbox';     pkg = 'sd-inbox-web';     title = 'Омниканальный инбокс'; controller = 'message';  ns = 'app\\inbox';    db = 'inbox';    port = 8002; web = 5175 },
    @{ dir = '03-sla';       pkg = 'sd-sla-web';       title = 'SLA-монитор';           controller = 'sla';      ns = 'app\\sla';      db = 'sla';      port = 8003; web = 5176 },
    @{ dir = '04-knowledge'; pkg = 'sd-knowledge-web'; title = 'База знаний';           controller = 'article';  ns = 'app\\kb';       db = 'knowledge'; port = 8004; web = 5177 },
    @{ dir = '05-suggest';   pkg = 'sd-suggest-web';   title = 'AI-подсказки ответов';  controller = 'draft';    ns = 'app\\suggest';  db = 'suggest';  port = 8005; web = 5178 },
    @{ dir = '06-csat';      pkg = 'sd-csat-web';      title = 'Аналитика CSAT';        controller = 'survey';   ns = 'app\\csat';     db = 'csat';     port = 8006; web = 5179 },
    @{ dir = '07-portal';    pkg = 'sd-portal-web';    title = 'Портал клиента';        controller = 'request';  ns = 'app\\portal';   db = 'portal';   port = 8007; web = 5180 },
    @{ dir = '08-workload';  pkg = 'sd-workload-web';  title = 'Нагрузка операторов';   controller = 'operator'; ns = 'app\\workload'; db = 'workload'; port = 8008; web = 5181 }
)

$indexPhp = @'
<?php

declare(strict_types=1);

defined('YII_DEBUG') || define('YII_DEBUG', true);
defined('YII_ENV') || define('YII_ENV', 'dev');

require __DIR__ . '/../../../../vendor/autoload.php';
require __DIR__ . '/../../../../vendor/yiisoft/yii2/Yii.php';

$config = require __DIR__ . '/../config/web.php';

(new yii\web\Application($config))->run();
'@

$tsconfig = @'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@sd/ui": ["../../../shared/ui/index.ts"] }
  },
  "include": ["src", "vite.config.ts"]
}
'@

$mainTsx = @'
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
'@

foreach ($project in $projects) {
    $apiPath = Join-Path $root "projects\$($project.dir)\api"
    $webPath = Join-Path $root "projects\$($project.dir)\web"
    $srcPath = Join-Path $webPath "src"

    New-Item -ItemType Directory -Path (Join-Path $apiPath 'web'), (Join-Path $apiPath 'config'), $srcPath -Force | Out-Null

    Set-Content -LiteralPath (Join-Path $apiPath 'web\index.php') -Value $indexPhp -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $webPath 'tsconfig.json') -Value $tsconfig -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $webPath 'src\main.tsx') -Value $mainTsx -Encoding UTF8

    $configPhp = @"
<?php

declare(strict_types=1);

use sd\platform\Bootstrap;

`$basePath = dirname(__DIR__);

return Bootstrap::config([
    'id' => '$($project.db)',
    'name' => '$($project.title)',
    'basePath' => `$basePath,
    'controllerNamespace' => '$($project.ns)\\controllers',
    'dbPath' => `$basePath . '/runtime/$($project.db).db',
    'rules' => [
        [
            'class' => 'yii\\rest\\UrlRule',
            'controller' => '$($project.controller)',
            'extraPatterns' => [
                'GET stats' => 'stats',
                'POST {id}/ai' => 'ai',
            ],
        ],
    ],
]);
"@
    Set-Content -LiteralPath (Join-Path $apiPath 'config\web.php') -Value $configPhp -Encoding UTF8

    $packageJson = @"
{
  "name": "$($project.pkg)",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@sd/ui": "1.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.7"
  }
}
"@
    Set-Content -LiteralPath (Join-Path $webPath 'package.json') -Value $packageJson -Encoding UTF8

    $viteConfig = @"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const sharedUi = resolve(here, "../../../shared/ui");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@sd/ui": sharedUi },
  },
  server: {
    port: $($project.web),
    proxy: {
      "/api": {
        target: "http://127.0.0.1:$($project.port)",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ""),
      },
    },
  },
});
"@
    Set-Content -LiteralPath (Join-Path $webPath 'vite.config.ts') -Value $viteConfig -Encoding UTF8

    $indexHtml = @"
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>$($project.title)</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"@
    Set-Content -LiteralPath (Join-Path $webPath 'index.html') -Value $indexHtml -Encoding UTF8

    Write-Output "scaffolded $($project.dir)"
}
