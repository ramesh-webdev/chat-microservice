
import { RateLimiterMemory } from 'rate-limiter-flexible';

const limiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 1, // per second(s)
});

export default async function rateLimiter(req, res, next){
  try{
    await limiter.consume(req.ip);
    next();
  }catch(err){
    res.status(429).json({ error: 'Too many requests' });
  }
}
