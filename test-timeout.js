let timer;
// A Readable stream that sends a chunk every second but never ends
const body = new ReadableStream({
  start(controller) {
    timer = setInterval(() => {
      console.log("sending a chunk");
      controller.enqueue(new TextEncoder().encode("a"));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  },
  cancel(reason) {
    console.log("cancelled");
    console.log(reason);
    clearInterval(timer);
  },
});

process.on("SIGINT", () => {
  console.log("Ctrl-C was pressed");
  console.log("interrupted!");
  console.log(controller.signal.reason);
  controller.abort();
});

const timeoutSignal = AbortSignal.timeout(1000 * 60 * 16 /* 16 minutes */);
const controller = new AbortController();
timeoutSignal.addEventListener(
  "abort",
  () => {
    console.log("timed out!");
    controller.abort("timed out!");
  },
  { signal: controller.signal }
);

(async () => {
  const response = await fetch("http://127.0.0.1:3000", {
    method: "POST",
    duplex: "half",
    body,
    signal: controller.signal,
  });

  console.log(response.status);
  console.log(Object.fromEntries(response.headers.entries()));
  console.log(await response.text());
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
