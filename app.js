const http = require("http");
const express = require("express");
const path = require("path");
const { swaggerUi, swaggerSpec } = require('./swagger');
const socketIo = require("socket.io");
const morgan = require("morgan");




// Importation des routes
const dispoRouter = require("./Routes/Dispo");
const rendezvousRouter = require("./Routes/RendezVous");
const eventsRouter = require("./Routes/Evenement");
const notificationRouter = require("./Routes/Notification");



// Importation des contrôleurs
const planningController = require("./Controller/PlanningController");

// Connexion MongoDB
const mongo = require("mongoose");
const db = require("./Config/db.json");

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
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");
app.use(express.json());  // Middleware pour analyser les requêtes JSON

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Configuration des routes
app.use("/apis", dispoRouter);
app.use("/apis", rendezvousRouter);
app.use("/apis", eventsRouter); 
app.use("/apis", notificationRouter);



// Chargement des variables d'environnement en premier
require('dotenv').config({ path: './.env' });
require('./Jobs_Notification/cron'); // lance le job automatiquement au démarrage

const cors = require('cors'); 
// Middleware
app.use(morgan("dev")); 
app.use(express.json()); // Pour analyser les requêtes JSON
app.use(cors());         // Pour gérer les CORS
app.use('/uploads', express.static('uploads')); // Pour servir les fichiers statiques (uploads)

// Vues
app.set("views", path.join(__dirname, "views")); // Définir le dossier des vues
app.set("view engine", "twig");                  // Définir le moteur de vues comme Twig

// ======== ROUTES ========
// Route definitions
const personalityTraitRoutes = require('./Routes/personality-trait.routes');
app.use("/api/personality-traits", personalityTraitRoutes);

// test routes 
const testRoutes = require('./Routes/test.routes');
app.use("/api/tests", testRoutes);


// test-category routes 
const testCategoryRoutes = require('./Routes/test-category.routes');
app.use("/api/test-categories", testCategoryRoutes);


// test-scoring-algorithm routes
const testScoringAlgorithmRoutes = require('./Routes/test-scoring-algorithm.routes');
app.use("/api/test-scoring-algorithms", testScoringAlgorithmRoutes);


// test-session routes
const testSessionRoutes = require('./Routes/test-session.routes');
app.use("/api/test-sessions", testSessionRoutes);


// question routes
const questionRoutes = require('./Routes/question.routes');
app.use("/api/questions", questionRoutes);


// psychological-profile routes
const psychologicalProfileRoutes = require('./Routes/psychological-profile.routes');
app.use("/api/psychological-profile", psychologicalProfileRoutes);


// test-recommendation routes
const testRecommendationRoutes = require('./Routes/test-recommendation.routes');
app.use("/api/test-recommendations", testRecommendationRoutes);


// psychological-report routes
const psychologicalReportRoutes = require('./Routes/psychological-report.routes');
app.use("/api/psychological-reports", psychologicalReportRoutes);

const testRoutes = require('./Routes/testRoutes'); // Ajustez le chemin selon votre structure
app.use('/api/test', testRoutes);
// Routes pour les utilisateurs
const UserRouter = require('./Routes/User');
app.use('/user', UserRouter);

// Routes pour les catégories de cours
const CoursCategory = require('./Models/CoursCategory');
const coursCategoryRoutes = require('./Routes/CoursCategory');
app.use('/api/coursecategories', coursCategoryRoutes);

// Routes pour les cours
const coursRoutes = require('./Routes/Cours');
app.use('/api/cours', coursRoutes);

// Routes pour les sessions de cours
const coursSessionRoutes = require('./Routes/CoursSession');
app.use('/api/courssessions', coursSessionRoutes);

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

// Création de l'application Express

// Création du serveur HTTP + WebSocket
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Autoriser les requêtes depuis toutes les origines
    methods: ["GET", "POST"]
  }
});

// Importation des contrôleurs
const socketController = require("./Controller/socketController"); // Gestion WebSocket

// Initialiser la logique WebSocket avec io
const messageApi = socketController(io); // Ce retour contient les fonctions REST
//

// Importation des routes
const postRouter = require("./Routes/Post");
const commentaireRouter = require("./Routes/Commentaire");
const groupeRouter = require("./Routes/group");



// Configuration du moteur de vue
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads/posts', express.static('uploads/posts'));

// 📌 Configuration des routes REST
app.use("/post", postRouter);
app.use("/commentaire", commentaireRouter);
app.use("/group", groupeRouter);

// Routes REST liées aux messages
app.get("/message/conversation", messageApi.getConversationMessages);
app.get("/message/conversations/:userId", messageApi.getUserConversations);

// Création et démarrage du serveur
server.listen(3000, () => console.log("✅ Server is running on port 3000"));
