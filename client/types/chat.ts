export interface ChatMessageSender {
  _id: string;
  name: string;
  profilePicture?: string;
}

export interface ChatMessage {
  _id: string;
  project: string;
  sender: ChatMessageSender;
  content: string;
  createdAt: string;
}
