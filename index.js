const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000

// Set up middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Set the views directory and the view engine to EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const getChatGptResponse = async (initialMessage, context) => {
    if (!context) {
        context = "";
    }
    const message = initialMessage.replace(/[\r\n]+/g, "")
    const input = `{"0":{"question":"${message}","role":"engineering manager","interview_type":"","attributes":"${context}"}}`
    console.log(input)
    const encodedInput = encodeURIComponent(input)
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://pf-rpc-prod.fly.dev/v3/questionBank.getAnswerForQuestionViaGPT?batch=1&input=${encodedInput}`,
        headers: {}
    };

    try {
        const apiResponse = await axios.request(config);
        const response = apiResponse.data[0].result.data;
        return response;
    } catch (error) {
        console.error(error);
    }
}
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
  });

// Serve HTML form using EJS template
app.get('/', (req, res) => {
    res.render('index', { response: null, message: null});
});

// Handle form submission
app.post('/', async (req, res) => {
    const message = req.body.message;
    const context = req.body.context;

    try {
        const response = await getChatGptResponse(message, context);
        // Render the index.ejs file with the response
        res.render('index', { response, message });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
