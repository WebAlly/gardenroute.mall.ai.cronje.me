# Garden Route Mall Guide

## Custom Chat bot based on ChatGPT

There are quite a few chat bots available online. However, most of them are based on a pre-trained model. This means that the chat bot is limited to the topics that the model was trained on. This is not the case with this chat bot. This chat bot is based on a custom model that was trained on a dataset of shopping data

### How it works

This app leverages [OpenAI](https://ai.com)'s recently released ChatGPT API with `gpt-3.5-turbo` model to respond to a chain of chat messages. Users submit messages to a [SvelteKit](https://kit.svelte.dev) API Endpoint/Request Handler, which relays the messages to the ChatGPT API. The responses are then proxied back to the client via SSE to stream the response in realtime.

### Built with
- Meta-Framework: [SvelteKit](https://kit.svelte.dev)
- Styles/Components: [TailwindCSS](https://tailwindcss.com) & [DaisyUI](https://daisyui.com)
- Deployment: [Vercel](https://vercel.com)


## Run Locally

Clone the repository
```sh
git clone https://github.com/charlpcronje/menlyn.mall.ai.cronje.me
```

Create a .env file within the new directory
```sh
cd chatty && touch .env
echo OPENAI_KEY=<YOUR_API_KEY_HERE> >> .env
```

Install dependencies & start the dev server
```sh
yarn && yarn dev
```

You can now access the dev server running at [localhost:5173](https://localhost:5173)
