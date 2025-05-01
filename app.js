// app.js

// 1. Charger les variables d’environnement en premier
require('dotenv').config();

const http      = require('http');
const express   = require('express');
const path      = require('path');
const cors      = require('cors');
const socketIo  = require('socket.io');
const mongo     = require('mongoose');

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
