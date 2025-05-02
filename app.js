// 1. Charger .env en premier
require('dotenv').config();

const http        = require('http');
const express     = require('express');
const path        = require('path');
const cors        = require('cors');
const morgan      = require('morgan');
const socketIo    = require('socket.io');
const mongoose    = require('mongoose');
const { swaggerUi, swaggerSpec } = require('./Config/swagger');

// 2. Connexion MongoDB
const { url: dbUrl } = require('./Config/db.json');
if (!dbUrl) {
  console.error("❌ URL de la base de données manquante !");
  process.exit(1);
}
mongoose
  .connect(dbUrl)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB', err));

// 3. Création de l’app Express
const app = express();

// 4. Middlewares globaux
app.use(morgan('dev'));                  // Logging HTTP
app.use(cors());                         // CORS
app.use(express.json());                 // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded parser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 6. Montée des routes
app.use('/api/personality-traits', require('./Routes/personality-trait.routes'));
app.use('/api/tests',             require('./Routes/test.routes'));
app.use('/api/test-categories',   require('./Routes/test-category.routes'));
app.use('/api/test-sessions',     require('./Routes/test-session.routes'));
app.use('/api/questions',         require('./Routes/question.routes'));
app.use('/api/psychological-profile', require('./Routes/psychological-profile.routes'));
app.use('/api/test-recommendations',  require('./Routes/test-recommendation.routes'));
app.use('/api/psychological-reports', require('./Routes/psychological-report.routes'));

app.use('/user',                   require('./Routes/User'));
app.use('/api/coursecategories',  require('./Routes/CoursCategory'));
app.use('/api/cours',             require('./Routes/Cours'));
app.use('/api/courssessions',     require('./Routes/CoursSession'));

app.use('/apis', require('./Routes/Dispo'));
app.use('/apis', require('./Routes/RendezVous'));
app.use('/apis', require('./Routes/Evenement'));
app.use('/apis', require('./Routes/Notification'));

app.use('/post',       require('./Routes/Post'));
app.use('/commentaire', require('./Routes/Commentaire'));
app.use('/group',      require('./Routes/group'));

// 7. Jobs de notifications
require('./Jobs_Notification/cron');

// 8. WebSocket
const server = http.createServer(app);
const io     = socketIo(server, { cors: { origin: '*', methods: ['GET','POST'] } });
const messageApi = require('./Controller/socketController')(io);

app.get('/message/conversation',          messageApi.getConversationMessages);
app.get('/message/conversations/:userId', messageApi.getUserConversations);

// 9. Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
