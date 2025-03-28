#!/usr/bin/env -S deno run --allow-read --allow-env --allow-net --unstable-kv

const kv = await Deno.openKv();

async function processCommand(input: string) {
  const [command, ..._args] = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const args = _args.map(arg => arg.startsWith('"') && arg.endsWith('"') ? arg.slice(1, -1) : arg);

  switch (command) {
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

//startRepl();
if (Deno.args.length > 0) {
  await processCommand(Deno.args.join(" "));
} else {
  startRepl();
}
