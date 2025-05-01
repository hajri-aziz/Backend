// 1. Charger les variables d’environnement en premier

const http      = require('http');
const express   = require('express');
const path      = require('path');
const cors      = require('cors');
const socketIo  = require('socket.io');
const mongo     = require('mongoose');
const morgan = require("morgan");
require('dotenv').config();


const { swaggerUi, swaggerSpec } = require('./Config/swagger');
// 2. Connexion à MongoDB
const { url: dbUrl } = require('./Config/db.json');
if (!dbUrl) {
  console.error("❌ Erreur : L'URL de la base de données est manquante !");
  process.exit(1);
}
mongo.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ Erreur de connexion MongoDB", err));

// 3. Création de l’application Express
const app = express();

// Chargement des variables d'environnement en premier
require('dotenv').config({ path: './.env' });
require('./Jobs_Notification/cron'); // lance le job automatiquement au démarrage

const cors = require('cors'); 

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

// Importation des contrôleurs
const socketController = require("./Controller/socketController"); // Gestion WebSocket

// Importation des routes
const postRouter = require("./Routes/Post");
const commentaireRouter = require("./Routes/Commentaire");
const groupeRouter = require("./Routes/group");



// Configuration du moteur de vue
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");

// Middlewares
// 4. Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Moteur de vues (Twig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

// 6. Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 7. Routes REST principales
app.use('/apis',          require('./Routes/Dispo'));
app.use('/apis',          require('./Routes/RendezVous'));
app.use('/apis',          require('./Routes/Evenement'));
app.use('/apis',          require('./Routes/Notification'));

app.use('/api/test',       require('./Routes/testRoutes'));
app.use('/user',           require('./Routes/User'));

app.use('/api/coursecategories', require('./Routes/CoursCategory'));
app.use('/api/cours',            require('./Routes/Cours'));
app.use('/api/courssessions',    require('./Routes/CoursSession'));

app.use('/post',       require('./Routes/Post'));
app.use('/commentaire', require('./Routes/Commentaire'));
app.use('/group',      require('./Routes/group'));

// 8. Lancer les jobs de notifications (cron)
require('./Jobs_Notification/cron');

// 9. WebSocket (socket.io)
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});
const socketController = require('./Controller/socketController');
const messageApi = socketController(io);

app.get('/message/conversation',           messageApi.getConversationMessages);
app.get('/message/conversations/:userId',  messageApi.getUserConversations);

// 10. Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
