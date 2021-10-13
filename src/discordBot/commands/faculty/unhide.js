const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  updateGuide,
  msToMinutesAndSeconds,
  handleCooldown,
  checkCourseCooldown,
  setCourseToPublic,
  getHiddenCourse,
  getLockedCourse } = require("../../services/service");
const { editEphemeral, editErrorEphemeral, sendEphemeral } = require("../../services/message");
const { facultyRole } = require("../../../../config.json");

const execute = async (interaction, client, Course) => {
  await sendEphemeral(interaction, "Unhiding course...");
  const courseName = interaction.options.getString("course").trim();
  const guild = client.guild;
  const category = getHiddenCourse(courseName, guild);
  if (!category) {
    return await editErrorEphemeral(interaction, `Invalid course name: ${courseName} or the course is public already!`);
  }
  const cooldown = checkCourseCooldown(courseName);
  if (cooldown) {
    const timeRemaining = Math.floor(cooldown - Date.now());
    const time = msToMinutesAndSeconds(timeRemaining);
    return await editErrorEphemeral(interaction, `Command cooldown [mm:ss]: you need to wait ${time}!`);
  }
  else {
    if (getLockedCourse(courseName, guild)) {
      await category.setName(`📚🔐 ${courseName}`);
    }
    else {
      await category.setName(`📚 ${courseName}`);
    }
    await editEphemeral(interaction, `This course ${courseName} is now public.`);
    await setCourseToPublic(courseName, Course);
    await client.emit("COURSES_CHANGED", Course);
    await updateGuide(client.guild, Course);
    handleCooldown(courseName);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unhide")
    .setDescription("Unhide course")
    .setDefaultPermission(false)
    .addStringOption(option =>
      option.setName("course")
        .setDescription("Unhide given course")
        .setRequired(true)),
  execute,
  usage: "/unhide [course name]",
  description: "Unhide course.",
  roles: ["admin", facultyRole],
};
