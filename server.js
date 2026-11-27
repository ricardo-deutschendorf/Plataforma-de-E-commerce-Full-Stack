const app = require('./serverApp');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Paste manager running at http://localhost:${PORT}`);
});
