
import app from "./src/app.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`AUTH-SERVICE RUNNING ON PORT ${PORT}`);
});
