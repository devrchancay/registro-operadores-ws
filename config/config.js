require("dotenv").config();

const DATABASE_URL =
  process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/registro_biometrico";

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    url: DATABASE_URL,
    dialect: "mysql",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    url: DATABASE_URL,
    dialect: "mysql",
  },
};
