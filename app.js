// Chargement des variables d'environnement
require('dotenv').config({ path: './.env' });

// Importation des dépendances
const http = require("http");
const express = require("express");
const path = require("path");
const socketIo = require("socket.io");
const mongo = require("mongoose");
const cors = require('cors');
const db = require("./Config/db.json");

// Importation des routes
const dispoRouter = require("./Routes/Dispo");
const rendezvousRouter = require("./Routes/RendezVous");
const eventsRouter = require("./Routes/Evenement");
const notificationRouter = require("./Routes/Notification");
const testRoutes = require('./Routes/testRoutes');
const UserRouter = require('./Routes/User');
const coursCategoryRoutes = require('./Routes/CoursCategory');
const coursRoutes = require('./Routes/Cours');
const coursSessionRoutes = require('./Routes/CoursSession');
const postRouter = require("./Routes/Post");
const commentaireRouter = require("./Routes/Commentaire");
const groupeRouter = require("./Routes/group");

// Importation des modèles
const CoursCategory = require('./Models/CoursCategory');

// Importation des contrôleurs
const planningController = require("./Controller/PlanningController");
const socketController = require("./Controller/socketController");

// Connexion MongoDB
if (!db.url) {
  console.error("Erreur : L'URL de la base de données est manquante !");
  process.exit(1);
}

mongo
  .connect(db.url)
  .then(() => console.log("Database connected ✅"))
  .catch((err) => console.error("Erreur de connexion MongoDB ❌", err));

// Création de l'application Express
var app = express();

// Configuration du moteur de vue
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");

// Middlewares
app.use(express.json());
app.use(express.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static('Uploads'));
app.use('/uploads/posts', express.static('uploads/posts'));

// Configuration des routes
app.use("/apis", dispoRouter);
app.use("/apis", rendezvousRouter);
app.use("/apis", eventsRouter);
app.use("/apis", notificationRouter);
app.use("/api/test", testRoutes);
app.use('/user', UserRouter);
app.use('/api/coursecategories', coursCategoryRoutes);
app.use('/api/cours', coursRoutes);
app.use('/api/courssessions', coursSessionRoutes);
app.use("/post", postRouter);
app.use("/commentaire", commentaireRouter);
app.use("/group", groupeRouter);


// Route pour mettre à jour une catégorie de cours
app.post('/api/coursecategories/update/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const updatedCategory = await CoursCategory.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Création du serveur HTTP + WebSocket
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

socketController(io);

// Lancement du job de notification
require('./Jobs_Notification/cron');

// Création et démarrage du serveur
server.listen(3000, () => console.log("✅ Server is running on port 3000"));