"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// index.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const lockNative_1 = __importDefault(require("./routes/lockNative"));
const transactions_1 = require("./realtime/transactions");
const catalog_1 = __importDefault(require("./routes/catalog"));
const getCasperTokenBalance_1 = require("./controllers/getCasperTokenBalance");
const getCasperTokenAllowance_1 = require("./controllers/getCasperTokenAllowance");
const listTransactions_1 = require("./controllers/listTransactions");
dotenv_1.default.config();
/* ----------------------------------
 * 1. App & Server
 * ---------------------------------- */
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 4000;
/* ----------------------------------
 * 2. Middleware
 * ---------------------------------- */
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
/* ----------------------------------
 * 3. Socket.IO
 * ---------------------------------- */
const io = new socket_io_1.Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});
(0, transactions_1.startTransactionStream)(io);
// expose io to controllers / services
app.set('io', io);
/* ----------------------------------
 * 4. Routes
 * ---------------------------------- */
//app.get("/", (_, res) => res.send("BridgeX Relayer Running"));
app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});
app.use('/api/v1/tests', lockNative_1.default);
app.use('/api/v1/catalog', catalog_1.default);
app.get('/api/v1/transactions', listTransactions_1.listTransactions);
app.get('/api/v1/casper/token-balance', getCasperTokenBalance_1.getCasperTokenBalance);
app.get('/api/v1/casper/token-allowance', getCasperTokenAllowance_1.getCasperTokenAllowance);
/* ----------------------------------
 * 5. Bootstrap services
 * ---------------------------------- */
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('dYs? Bootstrapping BridgeX relayer...');
        console.log('dY`, Web service ready');
    });
}
/* ----------------------------------
 * 6. Start server
 * ---------------------------------- */
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`dYO? Server running on http://localhost:${PORT}`);
    yield bootstrap();
}));
// keep process alive (optional, node already does)
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
