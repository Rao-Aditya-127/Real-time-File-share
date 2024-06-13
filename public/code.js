(function(){
    let receiverID;
    const socket = io();

    function generateID(){
        return `${Math.trunc(Math.random() * 999)}-${Math.trunc(Math.random() * 999)}-${Math.trunc(Math.random() * 999)}`;
    }

    document.querySelector("#sender-start-con-btn").addEventListener("click",function(){
            let joinID = generateID();
            document.querySelector("#join-id").innerHTML = `
                    <b>Room ID</b>
                    <span>${joinID}</span>
            `;

            socket.emit("sender-join", {
                uid:joinID
            });

    });

    socket.on("init" , function(uid){
        receiverID = uid;
        document.querySelector(".join-screen").classList.remove("active");
        document.querySelector(".fs-screen").classList.add("active");
    });

    document.querySelector("#file-input").addEventListener("change" , function(e){
        let file = e.target.files[0];
		if(!file){
			return;		
		}

        loadFile(e.target.files , 0);

    });

    function loadFile(files , index){
        let file;
        if(index < files.length){
            file = files[index];

            let reader = new FileReader();
		    reader.onload = function(e){
                let buffer = new Uint8Array(reader.result);

                let el = document.createElement("div");
                el.classList.add("item");
                el.innerHTML = `
                        <div class="progress">0%</div>
                        <div class="filename">${file.name}</div>
                `;
                document.querySelector(".files-list").appendChild(el);
                shareFile({
                    filename: file.name,
                    total_buffer_size:buffer.length,
                    buffer_size:20971520 //10485760,
                }, buffer, el.querySelector(".progress") , function(){index = index + 1; loadFile(files , index)});
		    }
		    reader.readAsArrayBuffer(file);
        }
        
    }

    function shareFile(metadata , buffer , progress_node , callback){

        socket.emit("file-meta", {
			uid:receiverID,
			metadata:metadata
		});
		
		socket.on("fs-share", function(){
			let chunk = buffer.slice(0,metadata.buffer_size);
            if(chunk.length != 0){
                console.log(chunk);
                buffer = buffer.slice(metadata.buffer_size,buffer.length);
                let precent = Math.trunc(((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100))
                progress_node.innerText = precent + "%";
                if(chunk.length != 0){
                    socket.emit("file-raw", {
                        uid:receiverID,
                        buffer:chunk
                    });
                } 
                if(precent == 100){
                    console.log("Sent file successfully");
                    callback();
                }
            }
            
		});
    }

})();
