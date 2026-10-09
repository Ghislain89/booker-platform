import { faker } from "@faker-js/faker";

export function createRandomUser() {
  const timestamp = Date.now();
  const randomString = faker.string.alphanumeric(8);
  const username = `test_${timestamp}_${randomString}`;
  const password = faker.internet.password();
  const email = `${username}@example.com`;

  return {
    username: username,
    password: password,
    email: email,
  };
}
