import express from 'express';
import axios from 'axios';
import * as config from './config.json';
import { getErrorMessage, isAuthorized } from './util';
import Quote from './models/quote';
import { generateToken, verifyToken } from './jwt';
import { collections } from './services/database.service';
import { JwtPayload } from 'jsonwebtoken';

const router = express.Router();

// get user information from discord oauth returned code
router.get('/discordValidate', async (req, res) => {
    const code = req.query.code;
    const params = new URLSearchParams();
    
    params.append('client_id', config.discord_client_id);
    params.append('client_secret', config.discord_client_secret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code as string);
    params.append('redirect_uri', config.discord_redirect);

    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', params);
        const { access_token, token_type } = response.data;
        const headers = { Authorization: `${token_type} ${access_token}` };
        // console.log(headers);

        // getting user information
        const userDataResponse = await axios.get('http://discord.com/api/users/@me', { headers });
        // console.log('fetched discord user information ', userDataResponse.data);

        // getting guild (server) status
        const guildDataResponse = await axios.get('https://discord.com/api/users/@me/guilds', { headers });
        const guild = guildDataResponse.data.find(guild => guild.id == config.discord_server_id) || null;
        
        // not in the correct guild, fail login
        if (!guild) throw new Error('not in server');

        // console.log('fetched discord guilds information', guildDataResponse.data);
        // console.log(guildDataResponse.data.find(guild => guild.id == config.discord_server_id));

        // get guild role if applicable
        const guildRoleResponse = await axios.get(`https://discord.com/api/users/@me/guilds/${config.discord_server_id}/member`, { headers });
        const hasRole = guildRoleResponse.data.roles.some(roleId => roleId == config.discord_role_id);

        // mising correct role, fail login
        if (!hasRole) throw new Error('missing correct role');

        const username = userDataResponse.data.username;
        const avatar = `https://cdn.discordapp.com/avatars/${userDataResponse.data.id}/${userDataResponse.data.avatar}.png`;

        // create json web token
        const token = generateToken(`${access_token}`);

        // insert code into database if doesnt exist, update date if exists
        collections.codes.updateOne(
            { code: access_token },
            { $set: { date: Date() } },
            { upsert: true }
        );

        return res.status(200).json({ token, username, avatar, profile: guildRoleResponse.data });
    }
    catch (error: any) {
        console.error('unauthorized', getErrorMessage(error));
        return res.status(401).json({ token: null });
    }
});

router.get('/discordInfo', isAuthorized, async (req, res) => {
    const result: JwtPayload = verifyToken(req.headers.authorization) as JwtPayload;

    const headers = { Authorization: `Bearer ${result.code}` };
    const userDataResponse = await axios.get('http://discord.com/api/users/@me', { headers });

    const username = userDataResponse.data.username;
    const avatar = `https://cdn.discordapp.com/avatars/${userDataResponse.data.id}/${userDataResponse.data.avatar}.png`;
});

// a function to refresh all attachments
export const refreshCDNLinks = async (quotes: Quote[]) => {
    const refreshMap = new Map<string, string>();
    const urlsToRefresh = [];
    var numRequests = 0;

    for (var quote of quotes) {
        for (var attachment of quote.attachments)
            // attachments that need to be refreshed start with 'https://cdn.discordapp.com/attachments/'
            if (
                attachment.url.startsWith('https://cdn.discordapp.com/attachments/')
                || attachment.url.startsWith('https://media.discordapp.com/attachments/')
            ) urlsToRefresh.push(attachment.url);

        // api cannot handle more than 50 urls at a time, send in batches
        if (urlsToRefresh.length == 50) {
            await postRefresh(urlsToRefresh, refreshMap);
            // clear url array
            urlsToRefresh.length = 0;
            numRequests++;
        }
    }
    // final post for any remaining urls
    if (urlsToRefresh.length > 0) {
        await postRefresh(urlsToRefresh, refreshMap);
        numRequests++;
    }

    // replace original urls with refreshed ones
    for (var q of quotes)
        for (var attachment of q.attachments)
            // replace attachment url if applicable
            if (refreshMap.has(attachment.url))
                attachment.url = refreshMap.get(attachment.url);

    // console.debug(refreshMap);
    // console.info(`refreshed ${refreshMap.size} urls in ${numRequests} requests`);

    return quotes;
};

const postRefresh = async (urlBatch: string[], map: Map<string, string>): Promise<void> => {
    const response = await axios.post(
        "https://discord.com/api/v9/attachments/refresh-urls",
        { attachment_urls: urlBatch, },
        { headers: { Authorization: config.discord_refresh_token } },
    );

    // add results to map
    for (var url of response.data.refreshed_urls)
        map.set(url.original, url.refreshed);
};

export default router;
