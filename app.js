const http = require("http");
const express = require("express");
const path = require("path");
const { swaggerUi, swaggerSpec } = require('./Config/swagger');
const socketIo = require("socket.io");
const cors = require('cors');
const morgan = require("morgan");
const mongo = require("mongoose");
 
// Chargement des variables d'environnement
require('dotenv').config({ path: './.env' });
require('./Jobs_Notification/cron'); // Lancement du job cron au démarrage
 
// Création de l'application Express
const app = express();
 
// Middleware configurations
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use('/uploads/posts', express.static('uploads/posts'));
 
// Configuration des vues
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");
 
// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 
// Connexion MongoDB
const db = require("./Config/db.json");
if (!db.url) {
  console.error("Erreur : L'URL de la base de données est manquante !");
  process.exit(1);
}
mongo
  .connect(db.url)
  .then(() => console.log("Database connected ✅"))
  .catch((err) => console.error("Erreur de connexion MongoDB ❌", err));
 
// Importation des routes du premier fichier
const personalityTraitRoutes = require('./Routes/personality-trait.routes');
app.use("/api/personality-traits", personalityTraitRoutes);
 
const testRoutes = require('./Routes/test.routes');
app.use("/api/tests", testRoutes);
 
const testCategoryRoutes = require('./Routes/test-category.routes');
app.use("/api/test-categories", testCategoryRoutes);
 
const testScoringAlgorithmRoutes = require('./Routes/test-scoring-algorithm.routes');
app.use("/api/test-scoring-algorithms", testScoringAlgorithmRoutes);
 
const testSessionRoutes = require('./Routes/test-session.routes');
app.use("/api/test-sessions", testSessionRoutes);
 
const questionRoutes = require('./Routes/question.routes');
app.use("/api/questions", questionRoutes);
 
const psychologicalProfileRoutes = require('./Routes/psychological-profile.routes');
app.use("/api/psychological-profile", psychologicalProfileRoutes);
 
const testRecommendationRoutes = require('./Routes/test-recommendation.routes');
app.use("/api/test-recommendations", testRecommendationRoutes);
 
const psychologicalReportRoutes = require('./Routes/psychological-report.routes');
app.use("/api/psychological-reports", psychologicalReportRoutes);
 
// Importation des routes du deuxième fichier
const dispoRouter = require("./Routes/Dispo");
app.use("/apis", dispoRouter);
 
const rendezvousRouter = require("./Routes/RendezVous");
app.use("/apis", rendezvousRouter);
 
const eventsRouter = require("./Routes/Evenement");
app.use("/apis", eventsRouter);
 
const notificationRouter = require("./Routes/Notification");
app.use("/apis", notificationRouter);
 
const testRoutes2 = require('./Routes/testRoutes');
app.use('/api/test', testRoutes2);
 
const UserRouter = require('./Routes/User');
app.use('/user', UserRouter);
 
const coursCategoryRoutes = require('./Routes/CoursCategory');
app.use('/api/coursecategories', coursCategoryRoutes);
 
const coursRoutes = require('./Routes/Cours');
app.use('/api/cours', coursRoutes);
 
const coursSessionRoutes = require('./Routes/CoursSession');
app.use('/api/courssessions', coursSessionRoutes);
 
const postRouter = require("./Routes/Post");
app.use("/post", postRouter);
 
const commentaireRouter = require("./Routes/Commentaire");
app.use("/commentaire", commentaireRouter);
 
const groupeRouter = require("./Routes/group");
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
 
// Initialisation WebSocket
const socketController = require("./Controller/socketController");
const messageApi = socketController(io);
 
// Routes REST liées aux messages
app.get("/message/conversation", messageApi.getConversationMessages);
app.get("/message/conversations/:userId", messageApi.getUserConversations);
 
// Importation des contrôleurs (non utilisé dans les routes, mais importé pour cohérence)
const planningController = require("./Controller/PlanningController");
 
// Création et démarrage du serveur
server.listen(3000, () => console.log("✅ Server is running on port 3000"));
