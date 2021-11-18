const { findAllCourseNames } = require("../../../db/services/courseService");
const { findCategoryWithCourseName } = require("../../services/service");

const execute = async (message, args, models) => {
  if (message.member.permissions.has("ADMINISTRATOR")) {
    const guild = message.client.guild;

    let first = 9999;

    const result = await findAllCourseNames(models.Course);
    result.sort((a, b) => a.localeCompare(b));
    result.map((c) => {
      const channel = findCategoryWithCourseName(c, guild);
      if (first > channel.position) first = channel.position;
      return c;
    });
    let category;

    for (let index = 0; index < result.length; index++) {
      const courseString = result[index];
      category = findCategoryWithCourseName(courseString, guild);
      await category.edit({ position: index + first });
    }
  }
};

module.exports = {
  prefix: true,
  name: "sort_courses",
  description: "Sort courses to alphabetical order.",
  role: "admin",
  usage: "!sort_courses",
  args: false,
  execute,
};
