import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.end('phlana.moe backend');
});

export default router;
