#!/usr/bin/env -S deno run --allow-read --allow-env --allow-net --unstable-kv

const kv = await Deno.openKv();

async function main(args: string[]) {
  const command = args[0];
  
  switch (command) {
    case "list":
      console.log("Listing all items:");
      for await (const entry of kv.list({ prefix: [] })) {
        console.log(entry.key, entry.value);
      }
      break;

    case "add":
      const key = args.slice(1, -1); // 配列としてキーを受け取る
      const rawValue = args[args.length - 1]; // 最後の引数をJSONとして扱う
      if (key.length === 0 || !rawValue) {
        console.error("Usage: add <key1> <key2> ... <JSON>");
        break;
      }

      try {
        const value = JSON.parse(rawValue); // JSONをパース
        await kv.set(key, value);
        console.log(`Added: ${key.join(", ")} ->`, value);
      } catch (e) {
        console.error("Invalid JSON format. Please provide a valid JSON string.");
      }
      break;

    case "get":
      const getKey = args.slice(1); // 配列キーを処理
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

    case "delete":
      const delKey = args.slice(1); // 配列キーを処理
      if (delKey.length === 0) {
        console.error("Usage: delete <key1> <key2> ...");
        break;
      }

      await kv.delete(delKey);
      console.log(`Deleted: ${delKey.join(", ")}`);
      break;

    default:
      console.log("Available commands: list, add, get, delete");
  }
}

main(Deno.args);
