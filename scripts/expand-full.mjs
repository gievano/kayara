import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const qPath = path.join(__dirname, "../data/questions.json");
const base = JSON.parse(fs.readFileSync(qPath, "utf8"));

// target: 60 per tahun = vocab 18 + grammar 16 + reading 10 + listening 16
// now per year: vocab 7, grammar 8, reading 5, listening 0
// need per year: vocab +11, grammar +8, reading +5, listening +16
// total add 200

function mk(year, section, seq, q, opts, ans, exp, note) {
  return { id: `n5-${year}-${section}-${String(seq).padStart(2,"0")}`, exam:"JLPT", level:"N5", year, section, question:q, options:opts, answer:ans, explanation:exp, sourceNote:note };
}

const extra = [];

// helper pools per year
for (const year of [2019,2020,2021,2022,2023]) {
  let vc = 8, gr = 9, rd = 6, ls = 1;
  // vocab 11 more
  const vocabAdds = [
    ["「ほん」を かいます。何を かいますか。", ["ほんを","ほんに","ほんが","ほんで"], 0, "ほんを かう (beli buku) pakai を.", `pola ${year} vocab wo kau`],
    ["「あおい そら」そらの いろは 何ですか。", ["あお","あか","しろ","きいろ"], 0, "そら = langit biru あお.", `pola ${year} vocab sora`],
    ["「いえ」は どこですか。", ["うち","そと","なか","うえ"], 0, "いえ = rumah = うち (N5).", `pola ${year} vocab ie`],
    ["「きょう」の あさ ごはんは 何ですか。", ["あさごはん","ひるごはん","ばんごはん","やしょく"], 0, "あさごはん = sarapan.", `pola ${year} vocab asa`],
    ["「にほんご」を はなします。何を はなしますか。", ["にほんごを","にほんごに","にほんごが","にほんごで"], 0, "にほんごを はなす.", `pola ${year} vocab hanasu`],
    ["「ともだち」の かんじは どれですか。", ["友達","友だち","友逹","反達"], 0, "ともだち = 友達.", `pola ${year} vocab kanji tomodachi`],
    ["「あつい」と 「さむい」は 何ですか。", ["はんたい","おなじ","ちかい","とおい"], 0, "あつい vs さむい = はんたい (antonim).", `pola ${year} vocab hantai`],
    ["「えいご」を べんきょうします。", ["べんきょうを","べんきょうに","べんきょうが","べんきょうで"], 0, "べんきょうを する.", `pola ${year} vocab benkyou`],
    ["「じてんしゃ」に のります。", ["じてんしゃに","じてんしゃを","じてんしゃが","じてんしゃで"], 0, "のる pakai に: じてんしゃに のる.", `pola ${year} vocab noru`],
    ["「おおい」ひとは どれですか。", ["たくさん いる","すくない","ちいさい","ひとり"], 0, "おおい = banyak orang.", `pola ${year} vocab ooi`],
    ["「しんかんせん」は 何ですか。", ["でんしゃ","ひこうき","ふね","くるま"], 0, "しんかんせん = kereta cepat (jenis でんしゃ).", `pola ${year} vocab shinkansen`],
  ];
  for (const [qq,opts,ans,exp,note] of vocabAdds) extra.push(mk(year,"vocab",vc++,qq,opts,ans,exp,note));

  const gramAdds = [
    ["かばん ___ つくえの うえに あります。", ["が","を","に","で"], 0, "かばんが あります pakai が.", `pola ${year} grammar ga aru`],
    ["わたし ___ にほんじん ___ す。", ["は／です","が／だ","を／で","に／が"], 0, "わたしは にほんじんです.", `pola ${year} grammar wa desu`],
    ["えいがを み ___ いきます。", ["に","を","で","が"], 0, "みに いく (pergi untuk menonton) pakai に.", `pola ${year} grammar ni iku`],
    ["きょうは ___ あついですね。", ["とても","あまり","ぜんぜん","ちょっと"], 0, "とても あつい (sangat panas).", `pola ${year} grammar totemo`],
    ["ほんを よ ___ ください。", ["んで","んでい","む","み"], 0, "よんで ください (baca).", `pola ${year} grammar te kudasai`],
    ["あしたは やすみ ___ 。", ["です","だ","である","でする"], 0, "やすみです.", `pola ${year} grammar desu yasumi`],
    ["さとうさんは どこ ___ はたらいていますか。", ["で","に","を","が"], 0, "はたらく場所 pakai で.", `pola ${year} grammar de hatara`],
    ["この くつは ___ ですか。いくらですか。", ["いくら","どこ","だれ","なに"], 0, "harga: いくらですか.", `pola ${year} grammar ikura`],
  ];
  for (const [qq,opts,ans,exp,note] of gramAdds) extra.push(mk(year,"grammar",gr++,qq,opts,ans,exp,note));

  const readAdds = [
    [`メール:${year}「あした 2じに 図書館で 会いましょう — たなか」 どこで 何時に。`, ["図書館 2時","駅 10時","学校 3時","家 9時"], 0, "図書館で 2じ.", `pola ${year} reading mail toshokan`],
    [`お知らせ:${year}「プール 7月1日〜8月31日、月曜休み」休みはいつ。`, ["月曜","火曜","土曜","日曜"], 0, "げつようび やすみ.", `pola ${year} reading pool`],
    [`メモ:${year}「たまご 10個、牛乳 2本」たまごは何個。`, ["10個","2本","10本","2個"], 0, "たまご 10こ.", `pola ${year} reading memo tamago`],
    [`チラシ:${year}「本屋 セール 1月15日〜31日 10時〜19時」何時まで。`, ["19時","10時","15時","31時"], 0, "19じまで.", `pola ${year} reading chirashi honya`],
    [`掲示:${year}「エレベーター故障、階段を使ってください」何を使う。`, ["階段","エレベーター","エスカレーター","ドア"], 0, "かいだん.", `pola ${year} reading keiji kaidan`],
  ];
  for (const [qq,opts,ans,exp,note] of readAdds) extra.push(mk(year,"reading",rd++,qq,opts,ans,exp,note));

  const listenAdds = [
    [`[Listening ${year}-01] 男:「あした 何時に 会いますか」女:「3時に 駅で」何時にどこで。`, ["3時 駅","2時 図書館","3時 学校","2時 駅"], 0, "3時に 駅で.", `pola ${year} listening jikan basho`],
    [`[Listening ${year}-02] アナウンス「電車は 2番線に 来ます」何番線。`, ["2番線","1番線","3番線","4番線"], 0, "2ばんせん.", `pola ${year} listening densha`],
    [`[Listening ${year}-03] 女:「コーヒーと 紅茶、どちらがいいですか」男:「紅茶を お願いします」何を頼む。`, ["紅茶","コーヒー","水","お茶"], 0, "こうちゃ.", `pola ${year} listening kissa`],
    [`[Listening ${year}-04] 先生:「宿題は 3ページです」宿題は何ページ。`, ["3ページ","2ページ","5ページ","10ページ"], 0, "3ページ.", `pola ${year} listening shukudai`],
    [`[Listening ${year}-05] 男:「この かさは 誰のですか」女:「私のです」誰の。`, ["女の人","男の人","先生","友達"], 0, "女の人 (私).", `pola ${year} listening kasa`],
    [`[Listening ${year}-06] アナウンス「今日は 雨です、傘を持ってください」何を持っていく。`, ["傘","かばん","本","鍵"], 0, "かさ.", `pola ${year} listening ame`],
    [`[Listening ${year}-07] 女:「明日は 土曜日ですか」男:「いいえ、日曜日です」明日は何曜日。`, ["日曜日","土曜日","月曜日","金曜日"], 0, "にちようび.", `pola ${year} listening youbi`],
    [`[Listening ${year}-08] 男:「いくらですか」店員:「500円です」いくら。`, ["500円","300円","600円","1000円"], 0, "500えん.", `pola ${year} listening ikura`],
    [`[Listening ${year}-09] 母:「冷蔵庫に 牛乳が あります」牛乳はどこ。`, ["冷蔵庫","机","かばん","台所"], 0, "れいぞうこ.", `pola ${year} listening reizoko`],
    [`[Listening ${year}-10] 男:「駅まで どうやって 行きますか」女:「バスで 行きます」何で。`, ["バス","電車","歩いて","車"], 0, "バスで.", `pola ${year} listening norimono`],
    [`[Listening ${year}-11] 女:「電話番号は 何番ですか」男:「090-1111-2222です」番号は。`, ["090-1111-2222","090-2222-1111","090-1111","1111-2222"], 0, "090-1111-2222.", `pola ${year} listening denwa`],
    [`[Listening ${year}-12] 先生:「明日は 運動会です、9時に 集まってください」何時に集まる。`, ["9時","8時","10時","7時"], 0, "9じ.", `pola ${year} listening undoukai`],
    [`[Listening ${year}-13] 男:「今日の 天気は どうですか」女:「晴れです」天気は。`, ["晴れ","雨","曇り","雪"], 0, "はれ.", `pola ${year} listening tenki`],
    [`[Listening ${year}-14] アナウンス「図書館は 5時までです」何時まで。`, ["5時","9時","6時","8時"], 0, "5じまで.", `pola ${year} listening toshokan`],
    [`[Listening ${year}-15] 女:「この 本は 誰のですか」男:「田中さんのです」誰の。`, ["田中さん","佐藤さん","私","先生"], 0, "たなかさん.", `pola ${year} listening hon dare`],
    [`[Listening ${year}-16] 男:「昼ごはんは 何を 食べますか」女:「カレーを 食べます」何を食べる。`, ["カレー","寿司","パン","そば"], 0, "カレー.", `pola ${year} listening hirugohan`],
  ];
  for (const [qq,opts,ans,exp,note] of listenAdds) extra.push(mk(year,"listening",ls++,qq,opts,ans,exp,note));
}

const merged = [...base, ...extra];
// dedup by id
const seen = new Set(); const out=[];
for (const q of merged) { if(!seen.has(q.id)){ seen.add(q.id); out.push(q); }}
out.sort((a,b)=> a.year-b.year || a.section.localeCompare(b.section) || a.id.localeCompare(b.id));
fs.writeFileSync(qPath, JSON.stringify(out, null, 2), "utf8");
console.log(`merged ${out.length} total`);
const byYear={}; out.forEach(q=>byYear[q.year]=(byYear[q.year]||0)+1);
console.log(byYear);
const byYS={}; out.forEach(q=>{ const k=`${q.year}-${q.section}`; byYS[k]=(byYS[k]||0)+1; });
console.log(byYS);
