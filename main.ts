#!/usr/bin/env -S deno run --allow-read --allow-env --allow-net --unstable-kv

const kv = await Deno.openKv();

async function processCommand(input: string) {
  const [command, ..._args] = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const args = _args.map((arg) =>
    arg.startsWith('"') && arg.endsWith('"') ? arg.slice(1, -1) : arg
  );

  switch (command) {
    case "clear": {
      try {
        console.log("Clearing all entries in the KV store...");
        for await (const entry of kv.list({ prefix: args })) {
          await kv.delete(entry.key);
          console.log(`Deleted: ${entry.key}`);
        }
        console.log("KV store cleared.");
      } catch (error) {
        console.error("Failed to clear KV store:", error.message);
      }
      break;
    }
    case "restore": {
      if (args.length > 0) {
        // ファイルからデータを読み込む
        const filePath = args[0];
        try {
          const fileData = await Deno.readTextFile(filePath);
          const entries = JSON.parse(fileData);

          if (Array.isArray(entries)) {
            for (const entry of entries) {
              if (entry.key && entry.value) {
                await kv.set(entry.key, entry.value);
                console.log(`Restored: ${entry.key} ->`, entry.value);
              } else {
                console.error("Invalid entry format:", entry);
              }
            }
          } else {
            console.error("Invalid file format. Expected an array of entries.");
          }
        } catch (error) {
          console.error("Failed to restore from file:", error.message);
        }
      } else {
        // 標準入力からデータを受け取る
        try {
          console.log("Awaiting JSON data via stdin...");
          const decoder = new TextDecoder();
          const stdin = await Deno.stdin.readable.getReader().read();
          if (stdin.value) {
            const inputData = decoder.decode(stdin.value);
            const entries = JSON.parse(inputData);

            if (Array.isArray(entries)) {
              for (const entry of entries) {
                if (entry.key && entry.value) {
                  await kv.set(entry.key, entry.value);
                  console.log(`Restored: ${entry.key} ->`, entry.value);
                } else {
                  console.error("Invalid entry format:", entry);
                }
              }
            } else {
              console.error(
                "Invalid input format. Expected an array of entries.",
              );
            }
          }
        } catch (error) {
          console.error("Failed to restore from stdin:", error.message);
        }
      }
      break;
    }

    case "dump": {
      try {
        const allEntries = [];
        for await (const entry of kv.list({ prefix: args })) {
          allEntries.push({ key: entry.key, value: entry.value });
        }
        console.log(JSON.stringify(allEntries, null, 2));
      } catch (error) {
        console.error("Failed to dump KV contents:", error);
      }
      break;
    }
    case "list": {
      console.log(`Listing items with prefix: ${args.join(", ") || "none"}`);
      for await (const entry of kv.list({ prefix: args })) {
        console.log(entry.key, entry.value);
      }
      break;
    }
    case "add": {
      const rawValue = args.pop();
      if (args.length === 0 || !rawValue) {
        console.error("Usage: add <key1> <key2> ... <JSON>");
        break;
      }
      try {
        const value = JSON.parse(rawValue); // JSONをパース
        await kv.set(args, value);
        console.log(`Added: ${args.join(", ")} ->`, value);
      } catch (_e) {
        console.error(
          "Invalid JSON format. Please provide a valid JSON string.",
        );
      }
      break;
    }
    case "get": {
      if (args.length === 0) {
        console.error("Usage: get <key1> <key2> ...");
        break;
      }

      const result = await kv.get(args);
      if (result) {
        console.log(`Value for key ${args.join(", ")}:`, result.value);
      } else {
        console.log(`Key not found: ${args.join(", ")}`);
      }
      break;
    }
    case "delete": {
      if (args.length === 0) {
        console.error("Usage: delete <key1> <key2> ...");
        break;
      }

      await kv.delete(args);
      console.log(`Deleted: ${args.join(", ")}`);
      break;
    }
    case "exit": {
      console.log("Exiting REPL. Goodbye!");
      Deno.exit(0);
      break;
    }
    default:
      console.log("Available commands: list, add, get, delete");
  }
}

async function startRepl() {
  console.log("Welcome to denoKvAdmin REPL! Type 'exit' to quit.");
  while (true) {
    const input = prompt(">");
    if (input) {
      await processCommand(input);
    }
  }
}

if (Deno.args.length > 0) {
  await processCommand(Deno.args.join(" "));
} else {
  startRepl();
}
