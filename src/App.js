import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle";
import io from "socket.io-client";
import { USER_CONNECTED, LOGOUT } from "./Communicate";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import GroupPanel2 from "./components/GroupPanel2";
import ChatBox2 from "./components/ChatBox2";

const socketURL = "http://localhost:4000";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: null,
      user: null,
      activeGroup: null,
      groups: [],
      joinedGroups: [],
      messages: [],
    };

    this.initSocket = this.initSocket.bind(this);
    this.getGroups = this.getGroups.bind(this);
    this.addGroup = this.addGroup.bind(this);
    this.leaveGroup = this.leaveGroup.bind(this);
    this.joinGroup = this.joinGroup.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.setActiveGroup = this.setActiveGroup.bind(this);
    this.setUser = this.setUser.bind(this);
    this.logout = this.logout.bind(this);
    this.getMessages = this.getMessages.bind(this);
  }

  componentWillMount() {
    this.initSocket();
  }

  // initialize socket
  initSocket = () => {
    const socket = io.connect(socketURL);
    //socket connect to server
    socket.on("connect", () => {
      console.log("User's connected to server");
    });
    this.setState({ socket });
    socket.on("createGroupRespose", (groupName) => {
      let { groups } = this.state;
      groups.push(groupName);
      this.setState({ groups });
    });
    socket.on("emitMessages", (messages) => {
      this.setState({ messages });
    });
  };

  getMessages = () => {
    const { socket } = this.state;
    socket.emit("getMessages");
  };

  getGroups() {
    const { socket } = this.state;
    const username = this.state.user.name;
    socket.emit("getGroups", username);
    socket.on("getGroupResponse", (res) => {
      this.setState({ groups: res.chatGroups });
      this.setState({ joinedGroups: res.joinedGroups });
    });
  }

  addGroup = (groupName) => {
    if (groupName.length) {
      const { socket } = this.state;
      const username = this.state.user.name;
      let { groups, joinedGroups } = this.state;
      groups.push(groupName);
      joinedGroups.push(groupName);
      this.setState({ groups });
      this.setState({ joinedGroups });
      socket.emit("createGroup", { username, groupName });
    }
  };

  leaveGroup = (groupName) => {
    const { socket } = this.state;
    const username = this.state.user.name;
    let { joinedGroups } = this.state;
    socket.emit("leaveGroup", { username, groupName });
    joinedGroups = joinedGroups.filter((group) => group !== groupName);
    this.setState({ joinedGroups });
    if (groupName === this.state.activeGroup)
      this.setState({ activeGroup: null });
  };

  joinGroup = (groupName) => {
    const { socket } = this.state;
    const username = this.state.user.name;
    let { joinedGroups } = this.state;
    socket.emit("joinGroup", { username, groupName });
    joinedGroups.push(groupName);
    this.setState({ joinedGroups });
  };

  sendMessage = (message) => {
    const { socket, activeGroup } = this.state;
    const username = this.state.user.name;
    socket.emit("sendMessage", { username, message, activeGroup });
    // socket.on("sendMessageResponse", (messages) => {
    //   this.setState({ messages });
    // });
  };

  setActiveGroup = (group) => {
    this.setState({ activeGroup: group });
    this.setState({ messages: [] });
    this.getMessages();
  };

  // send user + ( USER_CONNECTED ) to server
  setUser = (user) => {
    const { socket } = this.state;
    socket.emit(USER_CONNECTED, user);
    this.setState({ user });
    this.getGroups();
    this.getMessages();
  };

  // send status (LOGOUT) to server and set state of user to null
  logout = () => {
    const { socket } = this.state;
    socket.emit(LOGOUT);
    this.setState({ user: null });
    this.setState({ activeGroup: null });
    this.setState({ groups: [] });
    this.setState({ joinedGroups: [] });
    this.setState({ messages: {} });
  };

  render() {
    const { socket, user } = this.state;
    return (
      <div className="container-fluid bg-dark">
        {!user ? (
          <Login socket={socket} setUser={this.setUser} />
        ) : (
          // <ChatBox socket={socket} user={user} logout={this.logout} />
          <div className="container-fluid bg-dark">
            <div className="row vh-100">
              <div className="col-8 mx-auto my-auto">
                <div className="container-fluid">
                  <Navbar name={user.name} logout={this.logout} />
                  <div className="row">
                    <div className="col-4 padding-r-0">
                      <GroupPanel2
                        groups={this.state.groups}
                        joinedGroups={this.state.joinedGroups}
                        leaveGroup={this.leaveGroup}
                        joinGroup={this.joinGroup}
                        addGroup={this.addGroup}
                        setActiveGroup={this.setActiveGroup}
                        activeGroup={this.state.activeGroup}
                      />
                    </div>
                    <div className="col-8 padding-l-0">
                      <ChatBox2
                        username={user.name}
                        sendMessage={this.sendMessage}
                        activeGroup={this.state.activeGroup}
                        messages={this.state.messages}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;
