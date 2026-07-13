import { describe, it, expect } from "vitest";
import { mapArxiv } from "./arxiv";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/1201.0490v4</id>
    <title>Scikit-learn: Machine Learning in Python</title>
    <link href="http://arxiv.org/abs/1201.0490v4" rel="alternate" type="text/html"/>
    <link title="pdf" href="http://arxiv.org/pdf/1201.0490v4" rel="related" type="application/pdf"/>
  </entry>
</feed>`;

describe("mapArxiv", () => {
  it("parses an Atom entry into an open-access paper with a PDF download", () => {
    const r = mapArxiv(xml)[0];
    expect(r.id).toBe("arxiv:1201.0490v4");
    expect(r.type).toBe("paper");
    expect(r.license).toBe("open-access");
    expect(r.title).toBe("Scikit-learn: Machine Learning in Python");
    expect(r.downloadUrl).toBe("http://arxiv.org/pdf/1201.0490v4");
  });
});
