const { findAllCoursesFromDb } = require("../../services/service");
const { sendEphemeral } = require("../utils");

const execute = async (interaction, client, Course) => {
  const courses = await findAllCoursesFromDb("fullName", Course);
  const data = courses.map((c) => `${c.fullName} - \`/join ${c.name}\``);
  if (data.length === 0) sendEphemeral(client, interaction, "No courses available");
  else sendEphemeral(client, interaction, data.join(" \n"));
};

module.exports = {
  name: "courses",
  description: "Get public course information.",
  usage: "/courses",
  args: false,
  joinArgs: false,
  guide: false,
  execute,
};
