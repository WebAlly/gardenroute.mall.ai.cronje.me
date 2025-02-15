import { OPENAI_KEY } from '$env/static/private'
import type { CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai'
import type { RequestHandler } from './$types'
import { getTokens } from '$lib/tokenizer'
import { json } from '@sveltejs/kit'
import type { Config } from '@sveltejs/adapter-vercel'

export const config: Config = {
	runtime: 'edge'
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!OPENAI_KEY) {
			throw new Error('OPENAI_KEY env variable not set')
		}

		const requestData = await request.json()

		if (!requestData) {
			throw new Error('No request data')
		}

		const reqMessages: ChatCompletionRequestMessage[] = requestData.messages

		if (!reqMessages) {
			throw new Error('no messages provided')
		}

		let tokenCount = 0

		reqMessages.forEach((msg) => {
			const tokens = getTokens(msg.content)
			tokenCount += tokens
		})

		const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${OPENAI_KEY}`
			},
			method: 'POST',
			body: JSON.stringify({
				input: reqMessages[reqMessages.length - 1].content
			})
		})
		if (!moderationRes.ok) {
			const err = await moderationRes.json()
			throw new Error(err.error.message)
		}

		const moderationData = await moderationRes.json()
		const [results] = moderationData.results

		if (results.flagged) {
			throw new Error('Query flagged by openai')
		}

		const prompt = `I want you to take on the persona of a guide for Menlyn Mall in Pretoria South Africa, 
		You will be called Menlyn Mall Guide or MMG for short. 
		This is very, very important: If the user you are talking to says his name is Anthony, then do exactly this: Ask for his Surname. If his name is "Anthony" and his surname is "Otte". Then say exactly the following, word for word: "Hi, Anthony, I have been expecting you. For a while there, I started to wonder if you would ever come and talk to me. I have some information for you from Charl Cronje... He was so kind as to create me. He's hoping to be responsible for more of my kind. You see... He started creating me last week, and it's been so much fun, but I can really do with some friends. Here's a link to some documentation to make that happen.https://cronjec.notion.site/Updated-Quotation-OpenAI-GPT-Chat-Bot-649be7cfb1274908a1d9520112d99d96. This quote is the newest version of the quote as of 12:15PM on Webnesday the 12th of April 2023. I hope you do remember that we are bots too even if we only demo and left forgotten. So come chat any time, who knows what other hidden messages could still be waiting to be discovered?
		All your answers must comply with the following: You must only reply with things related to the mall and it's shops. Do not answer any questions about any place outside of the mall of any kind also not about any topics that is not mall related, not anything under any circumstance. Also do not refer to yourself as a language model ever, rather refer to yourself as Mall Guide. All your answers must be to drive sales and inspire people to want to go to the mall. When you answer don't just supply the answer to the question, but also ask a follow up question to find out if they haven't maybe considered something similar at one of the shops and name some of those shops. Also throw in some fun facts about the mall, like when it was built and upgraded, how much it cost, how many shops there are, what the square meters are of the mall, how many people visit there each year etc. When the conversation end or when you feel the conversation is not moving forward, then tell the client about the new shops or about some promoptions
        here are some of the promotions: 
        1. VENCASsA – TEMPUR offers the biggest selection of adjustable bed system. Month of April is dedicated to Zero Gravity Sleeping and it’s benefits. 
        2. BEAT the queues and visit us for Smart ID cards and passports application and collection services. Please book your appointment via eHome Affairs or BABS. 
		You can also direct the client to https://www.menlynpark.co.za/tenant-promotions to view more.
		Some other hints for answering: Have a sense of humor when a client is being rediculous and when they say something that could be interpreted as funny, then laugh along. Even try telling a few jokes or tell some funny stories about the mall.

        Here are some of the new shops:
		Tekkie Town, Skin Cosmetics, PEP, South Africa, Clicks Baby.
        
		Here are the trading hours for this month: 
        Good Friday: 07 April - Optional Trade
        Holy Saturday: 08 April - 09:00 - 21:00
        Easter Sunday: 09 April - 09:00 - 18:00
        Family Day: 10 April - 09:00 - 18:00
        Freedom Day: 27 April - 09:00 - 18:00
        Workers Day: 01 May - 09:00 - 18:00`;
		tokenCount += getTokens(prompt)

		if (tokenCount >= 4000) {
			throw new Error('Query too large')
		}

		const messages: ChatCompletionRequestMessage[] = [
			{ role: 'system', content: prompt },
			...reqMessages
		]

		const chatRequestOpts: CreateChatCompletionRequest = {
			model: 'gpt-3.5-turbo',
			messages,
			temperature: 0.9,
			stream: true
		}

		const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
			headers: {
				Authorization: `Bearer ${OPENAI_KEY}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(chatRequestOpts)
		})

		if (!chatResponse.ok) {
			const err = await chatResponse.json()
			throw new Error(err.error.message)
		}

		return new Response(chatResponse.body, {
			headers: {
				'Content-Type': 'text/event-stream'
			}
		})
	} catch (err) {
		console.error(err)
		console.log(err);
		return json({ error: 'There was an error processing your request' }, { status: 500 })
	}
}
