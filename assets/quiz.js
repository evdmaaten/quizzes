function loadQuiz(questions){

let score = 0;

const quizDiv = document.getElementById("quiz");

questions.forEach((item,index)=>{

const card = document.createElement("div");
card.className="card";

const q = document.createElement("div");
q.className="question";
q.innerText = (index+1)+". "+item.q;

const answers = document.createElement("div");
answers.className="answers";

item.a.forEach((text,i)=>{

const btn = document.createElement("button");
btn.innerText=text;

btn.onclick=()=>{

if(btn.classList.contains("correct") || btn.classList.contains("incorrect")) return;

if(i===item.correct){
btn.classList.add("correct");
score++;
}else{
btn.classList.add("incorrect");
answers.children[item.correct].classList.add("correct");
}

document.getElementById("score").innerText =
"Score: "+score+" / "+questions.length;

};

answers.appendChild(btn);

});

card.appendChild(q);
card.appendChild(answers);

quizDiv.appendChild(card);

});

}
