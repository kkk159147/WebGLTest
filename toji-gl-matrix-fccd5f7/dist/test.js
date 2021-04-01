var tete = function ()
{
    var cmd = "가르치기!";
    var data2 = ["aasd" , "assd"];
if (cmd == "가르치기!") {  
    //말을 가르치는 부분 
    var data2 = data.split(" - ");
    learn[data2[0]] = data2[1];
    replier.reply(data2[0] + " (이)라고 말하면, " + data2[1] + " (이)라고 말하도록 배웠습니다!");
  }
  if (learn[msg] != null) {  
    //가르친 말을 하는 부분 
    replier.reply(learn[msg]);
  }
};


