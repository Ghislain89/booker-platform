import { faker } from "@faker-js/faker";
import { test, expect } from "../../support/fixtures/ui.fixture";

test("admin adds, edits and deletes a room", async ({ page }) => {
  const number = `T${faker.string.numeric(6)}`;
  const dialog = page.getByRole("dialog");
  const row = page.getByTestId("room-row").filter({ hasText: number });

  await page.goto("/admin/rooms");

  await test.step("add a room", async () => {
    await page.getByRole("button", { name: "Add room" }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Room number").fill(number);
    await dialog.getByLabel("Room type").selectOption("Suite");
    await dialog.getByLabel("Price per night").fill("275");
    await dialog.getByLabel("Capacity").fill("3");
    await dialog.getByRole("button", { name: "Save room" }).click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("region", { name: "Notifications" }),
    ).toContainText(`Room ${number} added.`);
  });

  await test.step("find it with the search box", async () => {
    await page.getByLabel("Search").fill(number);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Suite");
    await expect(row).toContainText("€ 275");
  });

  await test.step("edit the price", async () => {
    await page.getByRole("button", { name: `Edit room ${number}` }).click();
    await expect(dialog.getByLabel("Room number")).toHaveValue(number);
    await dialog.getByLabel("Price per night").fill("300");
    await dialog.getByRole("button", { name: "Save room" }).click();
    await expect(row).toContainText("€ 300");
  });

  await test.step("delete the room", async () => {
    await page.getByRole("button", { name: `Delete room ${number}` }).click();
    await expect(dialog).toContainText(`Delete room ${number}?`);
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(row).toHaveCount(0);
  });
});

test("admin can't delete a room that has bookings", async ({ page, seed }) => {
  const { rooms } = await seed({
    rooms: [{ number: "101", type: "STANDARD", price: 90, capacity: 2 }],
    bookings: [
      {
        user: "user",
        room: "101",
        checkIn: "2031-10-01",
        checkOut: "2031-10-03",
      },
    ],
  });
  const room = rooms[0];

  await page.goto("/admin/rooms");
  await page.getByLabel("Search").fill(room.number);
  await page
    .getByRole("button", { name: `Delete room ${room.number}` })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();

  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await expect(
    page.getByTestId("room-row").filter({ hasText: room.number }),
  ).toHaveCount(1);
});
