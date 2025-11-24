# Supabase MCP Connection Guide

Use this guide to connect Lucent Agent to Supabase through the Model Context Protocol (MCP) so that AI copilots such as Cursor or Claude Desktop can query your project metadata via the official Supabase MCP server.

## 1. Generate a Supabase Personal Access Token (PAT)

1. Sign in to [Supabase](https://supabase.com/).
2. Open **Account Settings → Access Tokens**.
3. Click **Generate new token**, give it a descriptive name (e.g. `Lucent MCP`), and copy the token somewhere safe. Supabase will not show it again.

> 💡 Start with read-only permissions while you test the integration.

## 2. Configure the MCP server command

This repo now includes a template at `mcp/supabase.mcp.json`:

```
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "<SUPABASE_PAT>"
      ]
    }
  }
}
```

Replace `<SUPABASE_PAT>` with the PAT you generated. Keep the file uncommitted (it contains a secret).

### Cursor MCP client

**Method 1: File-based configuration (recommended)**

1. Copy `mcp/supabase.mcp.json` to `.cursor/mcp.json` (Cursor reads from that location).  
   ```bash
   mkdir -p .cursor
   cp mcp/supabase.mcp.json .cursor/mcp.json
   ```
2. Open `.cursor/mcp.json` and paste your PAT in place of `<SUPABASE_PAT>`.
3. Restart Cursor; you should see the Supabase MCP server appear with a green indicator.

**Method 2: Cursor Settings UI**

1. Open Cursor Settings:
   - **macOS**: `Cmd + ,` (or Cursor → Settings)
   - **Windows/Linux**: `Ctrl + ,`
2. Search for "MCP" or "Model Context Protocol" in the settings search bar
3. Look for an "MCP Servers" or "Tools" section
4. Click "Add Server" or "+" button
5. Configure the server:
   - **Name**: `supabase`
   - **Command**: `npx`
   - **Args**: 
     ```
     -y
     @supabase/mcp-server-supabase@latest
     --access-token
     <YOUR_PAT>
     ```
   - Replace `<YOUR_PAT>` with your actual token
6. Save and restart Cursor

**Method 3: Hosted MCP Server (alternative)**

If you prefer using Supabase's hosted MCP server, use `mcp/supabase-hosted.mcp.json` instead:

```bash
cp mcp/supabase-hosted.mcp.json .cursor/mcp.json
```

This will prompt you to authenticate via browser when Cursor connects.

### Claude Desktop / other MCP clients

Point the client to the same command:

```
npx -y @supabase/mcp-server-supabase@latest --access-token <SUPABASE_PAT>
```

Most clients let you provide this command via their MCP settings UI.

## 3. Running the server manually (optional)

To troubleshoot outside the IDE, run:

```bash
npx -y @supabase/mcp-server-supabase@latest --access-token <SUPABASE_PAT>
```

Keep the terminal open so the MCP server stays online.

## 4. Security best practices

- Never commit the PAT; keep `mcp/supabase.mcp.json` with the placeholder value in git.
- Regenerate the token periodically and revoke it immediately if it leaks.
- Use separate tokens for development and production data.

Following these steps will let MCP-aware tools access your Supabase project alongside the Lucent Agent codebase.

