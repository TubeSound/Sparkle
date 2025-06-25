// ChartEmbed.jsx
import { useEffect, useState, useRef } from "react";

function ChartEmbed() {
    const [chartHTML, setChartHTML] = useState({ script: "", div: "" });
    const scriptContainerRef = useRef(null); // スクリプトを挿入する要素への参照

    useEffect(() => {
        // 1. FastAPIからBokehのHTML/JSを取得
        fetch("http://localhost:8000/bokeh-embed")
            .then((res) => {
                if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                console.log("✅ Fetch success:", data);
                setChartHTML(data);
            })
            .catch((err) => {
                console.error("❌ Fetch failed:", err);
            });
    }, []); // 初回マウント時のみ実行

    useEffect(() => {
        // 2. chartHTML.script が更新されたらスクリプトを動的に挿入して実行
        if (chartHTML.script && scriptContainerRef.current) {
            // 古いスクリプトが残っている可能性があるのでクリア
            scriptContainerRef.current.innerHTML = "";

            // スクリプト要素を作成し、内部のJavaScriptコードを設定
            const scriptElement = document.createElement("script");
            scriptElement.type = "text/javascript";
            // innerHTMLはスクリプトタグ全体ではなく、その中のJavaScriptコード部分
            // Bokehのcomponentsが返すscriptは、<script>...</script>なので、innerHTMLで抽出
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = chartHTML.script;
            const innerScript = tempDiv.querySelector("script");

            if (innerScript && innerScript.textContent) {
                scriptElement.textContent = innerScript.textContent;
                // スクリプトをDOMにアペンドし、ブラウザに実行させる
                scriptContainerRef.current.appendChild(scriptElement);
                console.log("✅ Bokeh script injected and should execute.");
            } else {
                console.error("❌ Bokeh script content not found in fetched data.");
            }
        }
    }, [chartHTML.script]); // chartHTML.script が変更されたときに実行

    return (
        <div>
            <h2>Bokehチャート</h2>
            <div
                dangerouslySetInnerHTML={{ __html: chartHTML.div }} // Bokehのdivを挿入
                style={{
                    border: "2px solid #555",
                    marginTop: "1rem",
                    padding: "1rem",
                    width: "fit-content", // グラフのサイズに合わせて調整
                    margin: "0 auto" // 中央寄せ
                }}
            />
            {/* Bokehスクリプトを実行するためのコンテナ。
          divがDOMに存在し、スクリプトがその後で実行されるように配置 */}
            <div ref={scriptContainerRef}></div>
        </div>
    );
}

export default ChartEmbed;