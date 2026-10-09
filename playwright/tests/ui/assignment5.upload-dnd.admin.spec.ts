// Assignment 5, option "Uploads and drag & drop". Runs as admin.
import { test, expect } from "../../support/fixtures/ui.fixture";

// A 1×1 PNG. setInputFiles also takes a path, but a buffer keeps the test self-contained.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test("admin uploads a room photo", async ({ page, seed }) => {
  const { rooms } = await seed({
    rooms: [{ number: "901", type: "SUITE", price: 250, capacity: 2 }],
  });
  const room = rooms[0];

  await page.goto("/admin/rooms");
  await page.getByLabel("Search").fill(room.number);
  await page.getByRole("button", { name: `Edit room ${room.number}` }).click();
  const dialog = page.getByRole("dialog", { name: `Edit room ${room.number}` });

  await dialog.getByLabel("Room photo").setInputFiles({
    name: "room.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await dialog.getByRole("button", { name: "Upload photo" }).click();
  await expect(
    page.getByRole("region", { name: "Notifications" }),
  ).toContainText(`Photo of room ${room.number} uploaded.`);
  await expect(
    dialog.getByRole("img", { name: `Current photo of room ${room.number}` }),
  ).toHaveAttribute("src", /\/uploads\//);

  // Guests see the upload as the first photo in the gallery.
  await page.goto(`/rooms/${room.number}`);
  await expect(
    page
      .getByRole("list", { name: `Photos of room ${room.number}` })
      .getByRole("img")
      .first(),
  ).toHaveAttribute("src", /\/uploads\//);
});

test("uploading a text file is refused", async ({ page, seed }) => {
  const { rooms } = await seed({
    rooms: [{ number: "902", type: "SUITE", price: 250, capacity: 2 }],
  });
  const room = rooms[0];

  await page.goto("/admin/rooms");
  await page.getByLabel("Search").fill(room.number);
  await page.getByRole("button", { name: `Edit room ${room.number}` }).click();
  const dialog = page.getByRole("dialog", { name: `Edit room ${room.number}` });
  await dialog.getByLabel("Room photo").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await dialog.getByRole("button", { name: "Upload photo" }).click();
  const input = dialog.getByLabel("Room photo");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(/PNG|JPEG|image/i);
  await expect(
    dialog.getByRole("img", { name: `Current photo of room ${room.number}` }),
  ).toHaveCount(0);
});

test.describe("change the room order", () => {
  // Other tests change the order too, so these tests check the order they
  // send, not the order they read back afterwards.
  test("with drag and drop", async ({ page, seed }) => {
    const { rooms } = await seed({
      rooms: [
        { number: "911", type: "STANDARD", price: 90, capacity: 2 },
        { number: "912", type: "STANDARD", price: 90, capacity: 2 },
      ],
    });
    const [first, second] = rooms;

    await page.goto("/admin/rooms");
    await page.getByRole("button", { name: "Change order" }).click();
    const dialog = page.getByRole("dialog", { name: "Change room order" });
    const item = (number: string) =>
      dialog.getByTestId("sortable-room").filter({ hasText: `Room ${number} ` });
    const ours = dialog
      .getByTestId("sortable-room")
      .filter({ hasText: new RegExp(`Room (${first.number}|${second.number}) `) });
    await expect(ours).toHaveText([
      new RegExp(`Room ${first.number} `),
      new RegExp(`Room ${second.number} `),
    ]);

    await item(second.number).dragTo(item(first.number));
    await expect(ours).toHaveText([
      new RegExp(`Room ${second.number} `),
      new RegExp(`Room ${first.number} `),
    ]);

    const saved = page.waitForRequest(
      (request) => request.url().endsWith("/api/rooms/order") && request.method() === "PUT",
    );
    await dialog.getByRole("button", { name: "Save order" }).click();
    const { roomIds } = (await saved).postDataJSON() as { roomIds: string[] };
    expect(roomIds.indexOf(second.id)).toBeLessThan(roomIds.indexOf(first.id));
    await expect(
      page.getByRole("region", { name: "Notifications" }),
    ).toContainText("Room order saved.");
    await expect(dialog).toBeHidden();
  });

  test("with the keyboard", async ({ page, seed }) => {
    const { rooms } = await seed({
      rooms: [{ number: "921", type: "STANDARD", price: 90, capacity: 2 }],
    });
    const room = rooms[0];

    await page.goto("/admin/rooms");
    await page.getByRole("button", { name: "Change order" }).click();
    const dialog = page.getByRole("dialog", { name: "Change room order" });
    const handle = dialog.getByRole("button", { name: `Move room ${room.number}` });
    const items = dialog.getByTestId("sortable-room");
    const position = async () =>
      (await items.allTextContents()).findIndex((text) =>
        text.includes(`Room ${room.number} `),
      );

    const before = await position();
    expect(before).toBeGreaterThan(0);
    await handle.focus();
    await page.keyboard.press("ArrowUp");

    await expect.poll(position).toBe(before - 1);
    await expect(handle).toBeFocused();
    await expect(dialog.getByText(`Room ${room.number} moved to position ${before}`)).toBeAttached();
  });
});
