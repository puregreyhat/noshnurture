
#include <iostream>
using namespace std;

struct Node{
    int data;
    Node *left,*right,*parent;
};

Node* root = NULL;

Node* create(int val){
    Node* t = new Node;
    t->data = val;
    t->left = t->right = t->parent = NULL;
    return t;
}

void heapify(Node* p){
    while(p->parent != NULL && p->data > p->parent->data){
        int temp = p->data;
        p->data = p->parent->data;
        p->parent->data = temp;
        p = p->parent;
    }
}

void insert(Node* &root,int val){

    Node* newnode = create(val);

    if(root == NULL){
        root = newnode;
        return;
    }

    Node* temp = root;

    while(true){

        if(temp->left == NULL){
            temp->left = newnode;
            newnode->parent = temp;
            break;
        }

        else if(temp->right == NULL){
            temp->right = newnode;
            newnode->parent = temp;
            break;
        }

        else
            temp = temp->left;
    }

    heapify(newnode);
}

void inorder(Node* root){
    if(root){
        inorder(root->left);
        cout<<root->data<<" ";
        inorder(root->right);
    }
}

int main(){

    int n,x;

    cout<<"Enter number of elements: ";
    cin>>n;

    for(int i=0;i<n;i++){
        cin>>x;
        insert(root,x);
    }

    cout<<"Heap (inorder): ";
    inorder(root);

}






  






