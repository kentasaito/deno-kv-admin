#!/usr/bin/env -S deno run --allow-read --allow-env --allow-net --unstable-kv

const kv = await Deno.openKv();

async function processCommand(input: string) {
  const [command, ..._args] = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const args = _args.map(arg => arg.startsWith('"') && arg.endsWith('"') ? arg.slice(1, -1) : arg);

  switch (command) {
    case "list": {
      const prefix = args.slice(0); // 配列としてprefixを受け取る
      console.log(`Listing items with prefix: ${prefix.join(", ") || "none"}`);
      for await (const entry of kv.list({ prefix })) {
        console.log(entry.key, entry.value);
      }
      break;
    }
    case "add": {
      const key = args.slice(0, -1); // 配列としてキーを受け取る
      const rawValue = args[args.length - 1]; // 最後の引数をJSONとして扱う
      if (key.length === 0 || !rawValue) {
        console.error("Usage: add <key1> <key2> ... <JSON>");
        break;
      }
      try {
        const value = JSON.parse(rawValue); // JSONをパース
        await kv.set(key, value);
        console.log(`Added: ${key.join(", ")} ->`, value);
      } catch (_e) {
        console.error(
          "Invalid JSON format. Please provide a valid JSON string.",
        );
      }
      break;
    }
    case "get": {
      const getKey = args.slice(0); // 配列キーを処理
      if (getKey.length === 0) {
        console.error("Usage: get <key1> <key2> ...");
        break;
      }

      const result = await kv.get(getKey);
      if (result) {
        console.log(`Value for key ${getKey.join(", ")}:`, result.value);
      } else {
        console.log(`Key not found: ${getKey.join(", ")}`);
      }
      break;
    }
    case "delete": {
      const delKey = args.slice(0); // 配列キーを処理
      if (delKey.length === 0) {
        console.error("Usage: delete <key1> <key2> ...");
        break;
      }

      await kv.delete(delKey);
      console.log(`Deleted: ${delKey.join(", ")}`);
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

//startRepl();
if (Deno.args.length > 0) {
  await processCommand(Deno.args.join(" "));
} else {
  startRepl();
}
