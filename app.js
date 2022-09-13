const express = require("express");
const app = express();
var cors = require("cors");
const jwt = require("jsonwebtoken");
const keys = require("./settings/keys");

app.set("key", keys.key);
app.set("keyRefresh", keys.keyRefresh); //se hace referencia a la key
app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.send("HOLA MUNDO");
});

app.listen(3000, () => {
  console.log("Servidor UP en http://localhost:3000");
});

app.post("/login", (req, res) => {
  if (req.body.user == "admin" && req.body.pass == "12345") {
    const payload = {
      check: true,
    };

    const token = jwt.sign(payload, app.get("key"), {
      expiresIn: "10s", //Tiempo de vida del token
    });

    const refreshToken = jwt.sign(payload, app.get("keyRefresh"), {
      expiresIn: "7d", //Tiempo de vida del token
    });

    res.json({
      message: "Autenticacion Exitosa",
      token: token,
      refreshToken: refreshToken,
    });
    
  } else {
    res.json({
      message: "Usuario y/o password son incorrectas",
    });
  }
});

app.post("/refresh-token", (req, res) => {
  refreshTokenFunc(req, res);
});

const refreshTokenFunc = async (req, res) => {
  const refreshToken = req.headers.refresh;

  if (!refreshToken) {
    res.status(400).json({ message: "Algo a ido mal" });
  }

  try {
    const verifyResult = jwt.verify(refreshToken, app.get("keyRefresh"));

    if (verifyResult.check) {
      const payload = {
        check: verifyResult.check,
      };

      const newtoken = jwt.sign(payload, app.get("key"), {
        expiresIn: "7d", //Tiempo de vida del token
      });

      res.json({ maessage: "Nuevo token:", token: newtoken });
    } else {
      res.json({ maessage: "Token invalido" });
    }
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
//para proteger de peticiones no deseadas

const verification = express.Router();

verification.use((req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];
  //   console.log(token);

  if (!token) {
    res.status(401).send({
      error: "Es necesario el token de autenticacion",
    });
    return;
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
    console.log(token);
  }

  if (token) {
    jwt.verify(token, app.get("key"), (err, decoded) => {
      if (err) {
        return res.json({
          message: err,
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  }
});

app.get("/info", verification, (req, res) => {
  res.json("INFORMACION IMPORTANTE ENTREGADA");
});
