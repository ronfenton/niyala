import React from "react"
import { Attribute as CharacterAttribute} from "../../characterApp/types"
import { CharacterContext } from "../../pages/character"

const AttributeDetail:React.FC<{a:CharacterAttribute,itemKey:string}> = ({a,itemKey}) => {
  const [state,setState] = React.useState({...a})
  const { dispatch } = React.useContext(CharacterContext)
  const isMounted = React.useRef(false)
  React.useEffect(() => {
    if (isMounted.current) {
      const delayDebounceFn = setTimeout(() => { 
        dispatch({type:"SET_ATTR",payload:{key:itemKey,data:state}})
      },3000)
      return () => clearTimeout(delayDebounceFn)
    }
    isMounted.current = true
  },[state])
  return <div>
    <label htmlFor={`attr.${a.name}.name`}>Name</label> <input id={`attr.${a.name}.name`} value={state.name} onChange={(e) => setState({...state,name:e.target.value})}/>
  </div>
}

export default AttributeDetail