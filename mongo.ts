import express from 'express';
import { ObjectId } from 'mongodb';
import { collections } from './services/database.service';
import Quote from './models/quote';
import { refreshCDNLinks } from "./discord";

const router = express.Router();

router.use(express.json());

// get all quotes
router.get('/getQuoteList', async (req, res) => {
    try {
        const quotes = await collections.quotes.find({}).toArray();

        // must refresh any attachment links as they expire outside of the discord client
        const refreshedQuotes = await refreshCDNLinks(quotes);

        res.status(200).send(refreshedQuotes);
    } catch (error) {
        // if (error instanceof Error)
            res.status(500).end(error.message);
    }
});

// delete quote
router.post('/deleteQuote', async (req, res) => {
    try {
        if (!req.query.id) {
            // missing parameter
            res.status(400).end('missing id parameter');
        }

        const delId = req.query.id as string;
        const result = await collections.quotes.deleteOne({_id: delId});

        if (result.deletedCount === 1) {
            // success
            res.status(200).send(`deleted quote with id: ${req.query.id}`);
        }
        else {
            // no matches
            res.status(404).end(`unable to find quote with id: ${req.query.id}`);
        }
    } catch (error) {
        // if (error instanceof Error)
            res.status(500).end(error.message);
    }
});

export default router;
