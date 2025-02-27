import { FastifyReply, FastifyRequest } from 'fastify';
import Logger from '../../utils/log';
import { AntiSpamApiResponse } from '../api_response';

const logger = new Logger('Chat');

export async function Chat(
    request: FastifyRequest<{
        Body: string;
    }>,
    reply: FastifyReply
) {
    const rsp = new AntiSpamApiResponse();
    rsp.statusCode = 200;
    rsp.success = true;
    rsp.isShadowMuted = false;
    reply.send(JSON.stringify(rsp));
}

//TODO: Https
export async function ChatFilter(
    request: FastifyRequest<{
        Body: {
            parts: {
                content: string
            }[]
        };
    }>,
    reply: FastifyReply
) {
    console.log(request.body);
}
