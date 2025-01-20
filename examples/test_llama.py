from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

documents = SimpleDirectoryReader("examples/ToAnotherCountry").load_data()
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()


while True:
    question = input("请输入问题：")
    if question == "exit":
        break
    response = query_engine.query(question)
    print(response)