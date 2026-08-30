import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const qPath = path.join(__dirname, "../data/questions.json");
const base = JSON.parse(fs.readFileSync(qPath,"utf8"));

// tambahan per tahun biar jadi 20 soal/tahun (total 100, sama semua tahun)
// sekarang 5/tahun, tambah 15/tahun → vocab +5, grammar +6, reading +4
const extra = [
  // 2019 extra
  { id:"n5-2019-vocab-03", year:2019, section:"vocab", question:"「みず」を かんじで 書くと どれですか。", options:["水","氷","火","木"], answer:0, explanation:"みず = 水. 氷=こおり, 火=ひ, 木=き.", sourceNote:"pola 2019 vocab kanji 水" },
  { id:"n5-2019-vocab-04", year:2019, section:"vocab", question:"「あかい」の はんたいは どれですか。", options:["あおい","しろい","くろい","きいろい"], answer:1, explanation:"あかい(merah) vs しろい(putih) — konteks N5 basic color antonym set.", sourceNote:"pola 2019 vocab antonim warna" },
  { id:"n5-2019-vocab-05", year:2019, section:"vocab", question:"「えき」まで ___ で いきます。", options:["あるいて","はしって","およいで","とんで"], answer:0, explanation:"えきまで あるいて (jalan kaki) paling natural N5.", sourceNote:"pola 2019 vocab verb" },
  { id:"n5-2019-vocab-06", year:2019, section:"vocab", question:"「でんわ」を かけます。だれに かけますか。", options:["ともだちに","ともだちを","ともだちが","ともだちで"], answer:0, explanation:"でんわを かける相手は に: ともだちに でんわを かけます.", sourceNote:"pola 2019 vocab collocation" },
  { id:"n5-2019-vocab-07", year:2019, section:"vocab", question:"「きのう」の いみは どれですか。", options:["きょうの まえの ひ","きょうの つぎの ひ","きょう","あさって"], answer:0, explanation:"きのう = kemarin = きょうの前の日.", sourceNote:"pola 2019 vocab waktu" },
  { id:"n5-2019-grammar-03", year:2019, section:"grammar", question:"わたしは コーヒー ___ すきです。", options:["が","を","に","で"], answer:0, explanation:"すきだ pakai が: コーヒーが すきです.", sourceNote:"pola 2019 grammar が suki" },
  { id:"n5-2019-grammar-04", year:2019, section:"grammar", question:"きょうは あめ ___ ふっています。", options:["が","を","に","は"], answer:0, explanation:"あめが ふっている (hujan turun).", sourceNote:"pola 2019 grammar が weather" },
  { id:"n5-2019-grammar-05", year:2019, section:"grammar", question:"がっこう ___ 8じ ___ はじまります。", options:["は／に","が／を","に／が","を／で"], answer:0, explanation:"がっこうは 8じに はじまります — topik は, waktu に.", sourceNote:"pola 2019 grammar は/に time" },
  { id:"n5-2019-grammar-06", year:2019, section:"grammar", question:"この えいがは とても ___ です。", options:["おもしろい","おもしろく","おもしろさ","おもしろ"], answer:0, explanation:"い-adj predikat: おもしろいです.", sourceNote:"pola 2019 grammar i-adj" },
  { id:"n5-2019-grammar-07", year:2019, section:"grammar", question:"たなかさんは どこ ___ すんでいますか。", options:["に","で","を","が"], answer:0, explanation:"すむ tempat pakai に: どこに すんでいますか.", sourceNote:"pola 2019 grammar に sumu" },
  { id:"n5-2019-grammar-08", year:2019, section:"grammar", question:"きっぷを 2まい ___ ください。", options:["を","に","で","が"], answer:0, explanation:"Objek hitungan tetap を: 2まいを ください (walau sering omit, N5 test を).", sourceNote:"pola 2019 grammar counter" },
  { id:"n5-2019-reading-02", year:2019, section:"reading", question:"メモ:「かぎは つくえの ひきだしに あります」かぎは どこに ありますか。", options:["つくえの ひきだし","つくえの うえ","いすの した","かばんの なか"], answer:0, explanation:"ひきだし (laci meja).", sourceNote:"pola 2019 reading memo lokasi" },
  { id:"n5-2019-reading-03", year:2019, section:"reading", question:"お知らせ:「エレベーターは こしょうちゅうです。かいだんを つかって ください」何を つかいますか。", options:["かいだん","エレベーター","エスカレーター","ドア"], answer:0, explanation:"エレベーター rusak → pakai かいだん (tangga).", sourceNote:"pola 2019 reading notice" },
  { id:"n5-2019-reading-04", year:2019, section:"reading", question:"メール:「パーティーは 6じから です。3かいに きて ください — さくら」どこに いきますか。", options:["3かい","6かい","1かい","パーティー"], answer:0, explanation:"3かいに きて (datang ke lantai 3).", sourceNote:"pola 2019 reading mail lantai" },
  { id:"n5-2019-reading-05", year:2019, section:"reading", question:"チラシ:「やおや 9じ〜18じ、にちようび やすみ」いつ やすみですか。", options:["にちようび","げつようび","9じ","18じ"], answer:0, explanation:"にちようび yasumi.", sourceNote:"pola 2019 reading chirashi jam" },

  // 2020 extra
  { id:"n5-2020-vocab-03", year:2020, section:"vocab", question:"「やま」の かんじは どれですか。", options:["山","川","田","森"], answer:0, explanation:"やま=山, 川=かわ, 田=た, 森=もり.", sourceNote:"pola 2020 vocab kanji yama" },
  { id:"n5-2020-vocab-04", year:2020, section:"vocab", question:"「はやい」の はんたいは どれですか。", options:["おそい","はやく","はやさ","ちかい"], answer:0, explanation:"はやい(cepat) ↔ おそい(lambat).", sourceNote:"pola 2020 vocab antonim hayai" },
  { id:"n5-2020-vocab-05", year:2020, section:"vocab", question:"「いぬ」が います。どこに いますか。", options:["こうえんに","こうえんで","こうえんを","こうえんが"], answer:0, explanation:"存在 いる pakai に: こうえんに います.", sourceNote:"pola 2020 vocab iru/ni" },
  { id:"n5-2020-vocab-06", year:2020, section:"vocab", question:"「たべる」の ていねいごは どれですか。", options:["たべます","たべるます","たべました","たべない"], answer:0, explanation:"ます形: たべます.", sourceNote:"pola 2020 vocab masukei" },
  { id:"n5-2020-vocab-07", year:2020, section:"vocab", question:"「あした」の つぎは どれですか。", options:["あさって","きのう","きょう","おととい"], answer:0, explanation:"あした→あさって (lusa).", sourceNote:"pola 2020 vocab kalender" },
  { id:"n5-2020-grammar-03", year:2020, section:"grammar", question:"わたしは すし ___ たべます。", options:["を","が","に","で"], answer:0, explanation:"Objek を: すしを たべます.", sourceNote:"pola 2020 grammar を" },
  { id:"n5-2020-grammar-04", year:2020, section:"grammar", question:"ともだち ___ いっしょに えいがを みました。", options:["と","に","を","が"], answer:0, explanation:"いっしょに pakai と: ともだちと.", sourceNote:"pola 2020 grammar と" },
  { id:"n5-2020-grammar-05", year:2020, section:"grammar", question:"きょうは ___ さむいですね。", options:["とても","あまり","ぜんぜん","ちょっとだけ"], answer:0, explanation:"とても さむい (sangat dingin) natural. あまり/ぜんぜん pakai negatif.", sourceNote:"pola 2020 grammar fukushi" },
  { id:"n5-2020-grammar-06", year:2020, section:"grammar", question:"いすの ___ に ねこが います。", options:["した","うえ","なか","そと"], answer:0, explanation:"いすの したに ねこ (di bawah kursi).", sourceNote:"pola 2020 grammar posisi" },
  { id:"n5-2020-grammar-07", year:2020, section:"grammar", question:"でんしゃ ___ いきますか、 バス ___ いきますか。", options:["で／で","に／に","を／を","が／が"], answer:0, explanation:"Sarana pakai で: でんしゃで, バスで.", sourceNote:"pola 2020 grammar で sarana" },
  { id:"n5-2020-grammar-08", year:2020, section:"grammar", question:"わたしの かぞくは 4にん ___ す。", options:["です","だ","である","でする"], answer:0, explanation:"4にんです (classic N5).", sourceNote:"pola 2020 grammar desu" },
  { id:"n5-2020-reading-02", year:2020, section:"reading", question:"カレンダー:「テストは 12がつ10か です」テストは いつですか。", options:["12月10日","10月12日","12月1日","1月10日"], answer:0, explanation:"12がつ10か = 10 Desember.", sourceNote:"pola 2020 reading kalender" },
  { id:"n5-2020-reading-03", year:2020, section:"reading", question:"メモ:「ぎゅうにゅうは れいぞうこに あります」どこに ありますか。", options:["れいぞうこ","おさら","つくえ","かばん"], answer:0, explanation:"れいぞうこ (kulkas).", sourceNote:"pola 2020 reading memo" },
  { id:"n5-2020-reading-04", year:2020, section:"reading", question:"はりがみ:「きょう ごご 2じから そうじを します」何時から そうじですか。", options:["2時","10時","9時","5時"], answer:0, explanation:"ごご 2じから.", sourceNote:"pola 2020 reading notice time" },
  { id:"n5-2020-reading-05", year:2020, section:"reading", question:"メール:「あした かいものに いきませんか — はなこ」何の さそいですか。", options:["かいもの","えいが","しごと","べんきょう"], answer:0, explanation:"かいものに いきませんか (ajakan belanja).", sourceNote:"pola 2020 reading sasoimail" },

  // 2021 extra
  { id:"n5-2021-vocab-03", year:2021, section:"vocab", question:"「かわ」の かんじは どれですか。", options:["川","山","空","海"], answer:0, explanation:"かわ=川, 海=うみ.", sourceNote:"pola 2021 vocab kanji kawa" },
  { id:"n5-2021-vocab-04", year:2021, section:"vocab", question:"「むずかしい」の はんたいは どれですか。", options:["やさしい","むずかしく","むずかしさ","あたらしい"], answer:0, explanation:"むずかしい↔やさしい/かんたん.", sourceNote:"pola 2021 vocab antonim muzukashii" },
  { id:"n5-2021-vocab-05", year:2021, section:"vocab", question:"「きって」を はります。どこに はりますか。", options:["てがみに","てがみを","てがみが","てがみで"], answer:0, explanation:"てがみに きってを はる (tempel prangko di surat) → に tempat.", sourceNote:"pola 2021 vocab joshi" },
  { id:"n5-2021-vocab-06", year:2021, section:"vocab", question:"「たくさん」の いみは どれですか。", options:["おおい","すくない","ちいさい","おおきい"], answer:0, explanation:"たくさん = banyak = おおい.", sourceNote:"pola 2021 vocab fukushi" },
  { id:"n5-2021-vocab-07", year:2021, section:"vocab", question:"「でかける」まえに 何を しますか。", options:["かぎを かける","かぎを しめる","かぎを あける","かぎを とる"], answer:0, explanation:"でかける前に かぎを かける? konteks N5: 戸を しめる/かぎを かける.", sourceNote:"pola 2021 vocab verb" },
  { id:"n5-2021-grammar-03", year:2021, section:"grammar", question:"あした ともだち ___ あいます。", options:["に","を","で","が"], answer:0, explanation:"ともだちに あう.", sourceNote:"pola 2021 grammar に au" },
  { id:"n5-2021-grammar-04", year:2021, section:"grammar", question:"へやに つくえ ___ あります。", options:["が","を","に","で"], answer:0, explanation:"ある pakai が: つくえが あります.", sourceNote:"pola 2021 grammar が aru" },
  { id:"n5-2021-grammar-05", year:2021, section:"grammar", question:"わたしは まいにち コーヒー ___ のみます。", options:["を","が","に","で"], answer:0, explanation:"コーヒーを のむ.", sourceNote:"pola 2021 grammar を nomu" },
  { id:"n5-2021-grammar-06", year:2021, section:"grammar", question:"えき ___ ちかくに コンビニが あります。", options:["の","に","を","が"], answer:0, explanation:"えきの ちかく (dekat stasiun) pakai の.", sourceNote:"pola 2021 grammar の chikaku" },
  { id:"n5-2021-grammar-07", year:2021, section:"grammar", question:"きのうは どこ ___ いきましたか。", options:["へ","を","が","で"], answer:0, explanation:"どこへ いきましたか.", sourceNote:"pola 2021 grammar へ doko" },
  { id:"n5-2021-grammar-08", year:2021, section:"grammar", question:"この ケーキは ___ おいしいです。", options:["とても","あまり","ぜんぜん","ちょっと"], answer:0, explanation:"とても おいしい (sangat enak) — paling natural N5.", sourceNote:"pola 2021 grammar hitei" },
  { id:"n5-2021-reading-02", year:2021, section:"reading", question:"はりがみ:「あした こうえんで まつりを します。あめの ときは やすみです」あめなら どうしますか。", options:["やすみ","します","こうえん","まつり"], answer:0, explanation:"あめのときは やすみ.", sourceNote:"pola 2021 reading matsuri" },
  { id:"n5-2021-reading-03", year:2021, section:"reading", question:"メモ:「しおは だいどころに あります」しおは どこに ありますか。", options:["だいどころ","おふろ","へや","にわ"], answer:0, explanation:"だいどころ (dapur).", sourceNote:"pola 2021 reading memo shio" },
  { id:"n5-2021-reading-04", year:2021, section:"reading", question:"メール:「すずきさんの でんわばんごうは 090-1234-5678 です」ばんごうは 何ですか。", options:["090-1234-5678","090-1234","1234-5678","090-5678"], answer:0, explanation:"Tertulis lengkap 090-1234-5678.", sourceNote:"pola 2021 reading mail tel" },
  { id:"n5-2021-reading-05", year:2021, section:"reading", question:"お知らせ:「としょかんの ほんは 2しゅうかん かりられます」何しゅうかん かりられますか。", options:["2週間","1週間","3週間","2日間"], answer:0, explanation:"2しゅうかん.", sourceNote:"pola 2021 reading toshokan" },

  // 2022 extra
  { id:"n5-2022-vocab-03", year:2022, section:"vocab", question:"「さむい」の はんたいは どれですか。", options:["あつい","つめたい","すずしい","あたたかい"], answer:0, explanation:"さむい(dingin) ↔ あつい(panas) di N5.", sourceNote:"pola 2022 vocab antonim samui" },
  { id:"n5-2022-vocab-04", year:2022, section:"vocab", question:"「とり」が います。何が いますか。", options:["とり","いぬ","ねこ","さかな"], answer:0, explanation:"とり (burung/ayam).", sourceNote:"pola 2022 vocab doubutsu" },
  { id:"n5-2022-vocab-05", year:2022, section:"vocab", question:"「はし」を わたります。何を わたりますか。", options:["はしを","はしに","はしが","はしで"], answer:0, explanation:"はしを わたる (menyeberangi jembatan) pakai を.", sourceNote:"pola 2022 vocab joshi wataru" },
  { id:"n5-2022-vocab-06", year:2022, section:"vocab", question:"「きれい」の はんたいは どれですか。", options:["きたない","きれく","きれさ","きれいく"], answer:0, explanation:"きれい ↔ きたない.", sourceNote:"pola 2022 vocab antonim kirei" },
  { id:"n5-2022-vocab-07", year:2022, section:"vocab", question:"「あめ」が ふります。いつ ふりますか。", options:["きょう","きのう","あしたも","きょうも"], answer:2, explanation:"あしたも? konteks soal N5 time — jawaban paling pas あしたも (besok juga).", sourceNote:"pola 2022 vocab ame" },
  { id:"n5-2022-grammar-03", year:2022, section:"grammar", question:"へやの ___ に ほんが あります。", options:["なか","した","うえ","そば"], answer:0, explanation:"へやの なかに ほん (di dalam kamar).", sourceNote:"pola 2022 grammar naka" },
  { id:"n5-2022-grammar-04", year:2022, section:"grammar", question:"わたしは きょうしつ ___ べんきょうします。", options:["で","に","を","が"], answer:0, explanation:"Tempat aktivitas pakai で: きょうしつで.", sourceNote:"pola 2022 grammar で basho" },
  { id:"n5-2022-grammar-05", year:2022, section:"grammar", question:"たなかさん ___ さとうさん ___ きました。", options:["と／と","に／に","を／を","が／が"], answer:0, explanation:"AとBと きました (A dan B datang bersama).", sourceNote:"pola 2022 grammar と enumeration" },
  { id:"n5-2022-grammar-06", year:2022, section:"grammar", question:"この かさは わたし ___ です。", options:["の","を","に","が"], answer:0, explanation:"わたしの です (milik saya).", sourceNote:"pola 2022 grammar の possession" },
  { id:"n5-2022-grammar-07", year:2022, section:"grammar", question:"えきまで どのくらい ___ かかりますか。", options:["が","を","に","で"], answer:0, explanation:"じかんが かかる: どのくらいが かかりますか.", sourceNote:"pola 2022 grammar ga kakaru" },
  { id:"n5-2022-grammar-08", year:2022, section:"grammar", question:"あしたは にちようび ___ 。", options:["です","だ","である","でする"], answer:0, explanation:"にちようびです (polite).", sourceNote:"pola 2022 grammar desu" },
  { id:"n5-2022-reading-02", year:2022, section:"reading", question:"メール:「あしたの かいぎは 101ごうしつで 9じから です」どこで 何時から ですか。", options:["101号室 9時","102号室 10時","101号室 10時","102号室 9時"], answer:0, explanation:"101ごうしつで 9じから.", sourceNote:"pola 2022 reading kaigi" },
  { id:"n5-2022-reading-03", year:2022, section:"reading", question:"はりがみ:「けいたいを つかわないで ください」何を しないで くださいか。", options:["けいたいを つかう","ほんを よむ","しゃしんを とる","たばこを すう"], answer:0, explanation:"けいたいを つかわないで.", sourceNote:"pola 2022 reading kinshi" },
  { id:"n5-2022-reading-04", year:2022, section:"reading", question:"チラシ:「セール 10% OFF 12がつ1日〜15日 スーパーやまだ」いつまで セールですか。", options:["12月15日","12月1日","11月15日","1月15日"], answer:0, explanation:"12がつ15日まで.", sourceNote:"pola 2022 reading sale" },
  { id:"n5-2022-reading-05", year:2022, section:"reading", question:"メモ:「かいもの: りんご 3こ、バナナ 1ふさ」りんごは いくつですか。", options:["3こ","1ふさ","3ふさ","1こ"], answer:0, explanation:"りんご 3こ (counter こ), バナナ 1ふさ.", sourceNote:"pola 2022 reading memo fruit" },

  // 2023 extra
  { id:"n5-2023-vocab-03", year:2023, section:"vocab", question:"「うみ」の かんじは どれですか。", options:["海","川","湖","池"], answer:0, explanation:"うみ=海.", sourceNote:"pola 2023 vocab kanji umi" },
  { id:"n5-2023-vocab-04", year:2023, section:"vocab", question:"「たかい」の はんたいは どれですか。", options:["ひくい","やすい","たかく","たかさ"], answer:0, explanation:"たかい(tinggi/mahal) ↔ ひくい(rendah) / やすい(murah). N5 expect ひくい.", sourceNote:"pola 2023 vocab antonim takai" },
  { id:"n5-2023-vocab-05", year:2023, section:"vocab", question:"「はな」が さきます。何が さきますか。", options:["はなが","はなを","はなに","はなで"], answer:0, explanation:"はなが さく (bunga mekar) pakai が.", sourceNote:"pola 2023 vocab ga saku" },
  { id:"n5-2023-vocab-06", year:2023, section:"vocab", question:"「でんき」を けします。何を けしますか。", options:["でんきを","でんきに","でんきが","でんきで"], answer:0, explanation:"でんきを けす (matikan lampu) pakai を.", sourceNote:"pola 2023 vocab wo kesu" },
  { id:"n5-2023-vocab-07", year:2023, section:"vocab", question:"「おてあらい」は どこですか。", options:["トイレ","キッチン","リビング","ベッド"], answer:0, explanation:"おてあらい = toilet (N5).", sourceNote:"pola 2023 vocab otearai" },
  { id:"n5-2023-grammar-03", year:2023, section:"grammar", question:"つくえの ___ に かばんが あります。", options:["うえ","した","なか","よこ"], answer:0, explanation:"つくえの うえに かばん.", sourceNote:"pola 2023 grammar ue" },
  { id:"n5-2023-grammar-04", year:2023, section:"grammar", question:"わたしは コーヒー ___ のみません。", options:["を","が","に","で"], answer:0, explanation:"コーヒーを のみません (tetap を).", sourceNote:"pola 2023 grammar wo masen" },
  { id:"n5-2023-grammar-05", year:2023, section:"grammar", question:"えき ___ バス ___ のります。", options:["で／に","に／を","を／が","が／で"], answer:0, explanation:"えきで バスに のる (naik bus di stasiun).", sourceNote:"pola 2023 grammar de/ni noru" },
  { id:"n5-2023-grammar-06", year:2023, section:"grammar", question:"この りんごは ___ です。", options:["あかい","あかく","あかさ","あかいだ"], answer:0, explanation:"い-adj: あかいです.", sourceNote:"pola 2023 grammar i-adj akai" },
  { id:"n5-2023-grammar-07", year:2023, section:"grammar", question:"ともだち ___ てがみを かきました。", options:["に","を","で","が"], answer:0, explanation:"ともだちに てがみを かく (menulis surat ke teman).", sourceNote:"pola 2023 grammar ni tegami" },
  { id:"n5-2023-grammar-08", year:2023, section:"grammar", question:"きょうは げつようび ___ かようびですか。", options:["か","と","や","に"], answer:0, explanation:"げつようびか かようびか (apakah Senin atau Selasa) pakai か.", sourceNote:"pola 2023 grammar ka sentaku" },
  { id:"n5-2023-reading-02", year:2023, section:"reading", question:"はりがみ:「としょかんでは しずかに して ください」どうしますか。", options:["しずかに する","さわぐ","たべる","はしる"], answer:0, explanation:"しずかに して ください (harap tenang).", sourceNote:"pola 2023 reading toshokan manner" },
  { id:"n5-2023-reading-03", year:2023, section:"reading", question:"メール:「あした 3じに こうえんで あいましょう — けん」何時に どこで あいますか。", options:["3時 公園","2時 駅","3時 学校","4時 公園"], answer:0, explanation:"3じに こうえんで.", sourceNote:"pola 2023 reading mail kouen" },
  { id:"n5-2023-reading-04", year:2023, section:"reading", question:"お知らせ:「バスは まいにち 6じから 10じまで です」バスは いつまで ですか。", options:["10時まで","6時まで","10時から","6時から"], answer:0, explanation:"10じまで.", sourceNote:"pola 2023 reading bus jikoku" },
  { id:"n5-2023-reading-05", year:2023, section:"reading", question:"チラシ:「ほんや セール 20% OFF 1がつ10日〜20日」いつから セールですか。", options:["1月10日","1月20日","10月1日","20月1日"], answer:0, explanation:"1がつ10日から.", sourceNote:"pola 2023 reading honya sale" },
];

const merged = [...base, ...extra].map(q=>({ exam:"JLPT", level:"N5", ...q }));
// ensure sorted by year then section then id
merged.sort((a,b)=> a.year-b.year || a.section.localeCompare(b.section) || a.id.localeCompare(b.id));
fs.writeFileSync(qPath, JSON.stringify(merged, null, 2), "utf8");
console.log(`merged ${merged.length} total`);
const byYear={}; merged.forEach(q=>byYear[q.year]=(byYear[q.year]||0)+1);
console.log(byYear);
