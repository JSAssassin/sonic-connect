const ping = (req, res) => {
  const response = {
    "subsonic-response": {
      "status": "ok",
      "version": "1.16.1",
      "type": "AwesomeServerName",
      "serverVersion": "0.1.3 (tag)",
      "openSubsonic": true
    }
  };
  res.json(response);
};

export default ping;
