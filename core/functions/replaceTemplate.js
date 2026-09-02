export function replaceTemplate(msg, context = {}) {
  return msg
    .replace("{count}", context.count ?? "")
    .replace("{value}", context.value ?? "")
    .replace("{min}", context.min ?? "")
    .replace("{aiResult1}", context.aiResult1 ?? "")
    .replace("{aiResult2}", context.aiResult2 ?? "")
    .replace("{validvalue}", context.validvalue ?? "")
    .replace("{urlvalue}", context.urlvalue ?? "")
      .replace("{x_orcid}", context.x_orcid ?? "")
      .replace("{x_people}", context.x_people ?? "")
      .replace("{email}", context.email ?? "")
      .replace("{auth}", context.auth ?? "")
      .replace("{protocol}", context.protocol ?? "");
    
}