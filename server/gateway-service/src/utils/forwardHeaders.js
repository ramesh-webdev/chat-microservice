
export function forwardHeaders(req){
  const headers = {};
  if(req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
  if(req.user && req.user.userId) headers['x-user-id'] = req.user.userId;
  return headers;
}
