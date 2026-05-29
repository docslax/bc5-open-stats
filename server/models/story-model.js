module.exports = {
  story: {
    title: "Admin tournament setup",
    summary: "Create a tournament year and host locations, then define teams per zone with coaches, players, and singes eligibility.",
    acceptanceCriteria: [
      "An admin can create a tournament year and associate one or more locations.",
      "The same bowler can appear in different tournament years without collisions.",
      "Teams are created per zone and include coaches and players.",
      "Singles eligibility is stored on the player/team record for the current tournament year.",
    ],
  },
};
